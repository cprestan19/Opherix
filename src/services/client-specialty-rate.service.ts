/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as clientSpecialtyRateRepo from "@/repositories/client-specialty-rate.repository";
import { findClientById } from "@/repositories/client.repository";
import { assertActiveSpecialtiesBelongToCompany, SpecialtyError } from "@/services/specialty.service";
import { logAudit } from "@/lib/audit";
import type { ClientSpecialtyRateInput } from "@/lib/validations/client-specialty-rate";

export class ClientSpecialtyRateError extends Error {}

export async function saveClientSpecialtyRates(
  companyId: string,
  actorId: string,
  input: ClientSpecialtyRateInput,
) {
  const client = await findClientById(companyId, input.clientId);
  if (!client) throw new ClientSpecialtyRateError("Cliente no encontrado.");

  try {
    await assertActiveSpecialtiesBelongToCompany(companyId, input.rates.map((r) => r.specialtyId));
  } catch (error) {
    if (error instanceof SpecialtyError) throw new ClientSpecialtyRateError(error.message);
    throw error;
  }

  const updated = await clientSpecialtyRateRepo.upsertRatesForClient(companyId, input.clientId, input.rates);

  await logAudit({
    companyId,
    actorId,
    action: "CLIENT_SPECIALTY_RATES_UPDATED",
    entityType: "Client",
    entityId: input.clientId,
    metadata: { rates: input.rates },
  });

  return updated;
}

export async function getClientSpecialtyRates(companyId: string, clientId: string) {
  return clientSpecialtyRateRepo.listRatesForClient(companyId, clientId);
}

/**
 * Total a cobrar al cliente por el evento (§ Configuración > Tarifas por
 * cliente): suma, por especialidad, la tarifa `chargeToClient` configurada
 * para ese cliente × cuántas asignaciones activas hay de esa especialidad,
 * con desglose. A propósito usa las asignaciones REALES (WorkerAssignment),
 * no `EventStaffRequirement` (lo solicitado originalmente) — lo que se le
 * cobra al cliente debe reflejar el personal que de verdad se va a usar en
 * el evento, que puede terminar siendo distinto a lo pedido al inicio.
 * Deliberadamente NO expone `payToWorker` — cuánto se le paga al personal es
 * información exclusiva de Pagos > Personal, nunca visible en la pantalla
 * de evento. `missingSpecialties` avisa cuando una especialidad asignada no
 * tiene tarifa configurada; `unassignedSpecialtyCount` avisa cuántas
 * asignaciones no tienen especialidad definida (ej. asignadas desde
 * Disponibilidad) — en ambos casos el total queda incompleto.
 */
export async function computeEventChargeTotal(
  companyId: string,
  clientId: string,
  assignments: { specialtyId: string | null; specialty: { name: string } | null; status: string }[],
) {
  const rates = await clientSpecialtyRateRepo.listRatesForClient(companyId, clientId);
  const rateBySpecialtyId = new Map(rates.map((r) => [r.specialtyId, r]));

  const activeAssignments = assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED");

  const countBySpecialty = new Map<string, { quantity: number; name: string }>();
  let unassignedSpecialtyCount = 0;
  for (const assignment of activeAssignments) {
    if (!assignment.specialtyId || !assignment.specialty) {
      unassignedSpecialtyCount += 1;
      continue;
    }
    const current = countBySpecialty.get(assignment.specialtyId);
    countBySpecialty.set(assignment.specialtyId, {
      quantity: (current?.quantity ?? 0) + 1,
      name: assignment.specialty.name,
    });
  }

  let chargeToClientTotal = 0;
  const missingSpecialties: { specialtyId: string; name: string }[] = [];
  const breakdown: { specialtyId: string; name: string; quantity: number; chargeToClient: number; subtotal: number }[] =
    [];

  for (const [specialtyId, { quantity, name }] of countBySpecialty) {
    const rate = rateBySpecialtyId.get(specialtyId);
    if (!rate) {
      missingSpecialties.push({ specialtyId, name });
      continue;
    }
    const chargeToClient = Number(rate.chargeToClient);
    const subtotal = chargeToClient * quantity;
    chargeToClientTotal += subtotal;
    breakdown.push({ specialtyId, name, quantity, chargeToClient, subtotal });
  }

  return { chargeToClientTotal, breakdown, missingSpecialties, unassignedSpecialtyCount };
}
