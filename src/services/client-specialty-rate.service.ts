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
 * cliente): suma, por cada EventStaffRequirement (specialty × quantity), la
 * tarifa `chargeToClient` configurada para ese cliente, con desglose por
 * especialidad. Deliberadamente NO expone `payToWorker` — cuánto se le paga
 * al personal es información exclusiva de Pagos > Personal, nunca visible
 * en la pantalla de evento. `missingSpecialties` avisa cuando una
 * especialidad requerida no tiene tarifa configurada — el total en ese caso
 * queda incompleto.
 */
export async function computeEventChargeTotal(
  companyId: string,
  clientId: string,
  staffRequirements: { specialty: Specialty; quantity: number }[],
) {
  const rates = await clientSpecialtyRateRepo.listRatesForClient(companyId, clientId);
  const rateBySpecialty = new Map(rates.map((r) => [r.specialty, r]));

  let chargeToClientTotal = 0;
  const missingSpecialties: Specialty[] = [];
  const breakdown: { specialty: Specialty; quantity: number; chargeToClient: number; subtotal: number }[] = [];

  for (const requirement of staffRequirements) {
    const rate = rateBySpecialty.get(requirement.specialty);
    if (!rate) {
      missingSpecialties.push(requirement.specialty);
      continue;
    }
    const chargeToClient = Number(rate.chargeToClient);
    const subtotal = chargeToClient * requirement.quantity;
    chargeToClientTotal += subtotal;
    breakdown.push({ specialty: requirement.specialty, quantity: requirement.quantity, chargeToClient, subtotal });
  }

  return { chargeToClientTotal, breakdown, missingSpecialties };
}
