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
import { logAudit } from "@/lib/audit";
import type { ClientSpecialtyRateInput } from "@/lib/validations/client-specialty-rate";
import type { Specialty } from "@/generated/prisma/enums";

export class ClientSpecialtyRateError extends Error {}

export async function saveClientSpecialtyRates(
  companyId: string,
  actorId: string,
  input: ClientSpecialtyRateInput,
) {
  const client = await findClientById(companyId, input.clientId);
  if (!client) throw new ClientSpecialtyRateError("Cliente no encontrado.");

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
  assignments: { specialty: Specialty | null; status: string }[],
) {
  const rates = await clientSpecialtyRateRepo.listRatesForClient(companyId, clientId);
  const rateBySpecialty = new Map(rates.map((r) => [r.specialty, r]));

  const activeAssignments = assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED");

  const countBySpecialty = new Map<Specialty, number>();
  let unassignedSpecialtyCount = 0;
  for (const assignment of activeAssignments) {
    if (!assignment.specialty) {
      unassignedSpecialtyCount += 1;
      continue;
    }
    countBySpecialty.set(assignment.specialty, (countBySpecialty.get(assignment.specialty) ?? 0) + 1);
  }

  let chargeToClientTotal = 0;
  const missingSpecialties: Specialty[] = [];
  const breakdown: { specialty: Specialty; quantity: number; chargeToClient: number; subtotal: number }[] = [];

  for (const [specialty, quantity] of countBySpecialty) {
    const rate = rateBySpecialty.get(specialty);
    if (!rate) {
      missingSpecialties.push(specialty);
      continue;
    }
    const chargeToClient = Number(rate.chargeToClient);
    const subtotal = chargeToClient * quantity;
    chargeToClientTotal += subtotal;
    breakdown.push({ specialty, quantity, chargeToClient, subtotal });
  }

  return { chargeToClientTotal, breakdown, missingSpecialties, unassignedSpecialtyCount };
}
