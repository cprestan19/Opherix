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
 * Total del evento (§ Configuración > Tarifas por cliente): suma, por cada
 * EventStaffRequirement (specialty × quantity), la tarifa configurada para
 * ese cliente. `missingSpecialties` avisa cuando una especialidad requerida
 * no tiene tarifa configurada — el total en ese caso queda incompleto.
 */
export async function computeEventStaffTotals(
  companyId: string,
  clientId: string,
  staffRequirements: { specialty: Specialty; quantity: number }[],
) {
  const rates = await clientSpecialtyRateRepo.listRatesForClient(companyId, clientId);
  const rateBySpecialty = new Map(rates.map((r) => [r.specialty, r]));

  let chargeToClientTotal = 0;
  let payToWorkerTotal = 0;
  const missingSpecialties: Specialty[] = [];

  for (const requirement of staffRequirements) {
    const rate = rateBySpecialty.get(requirement.specialty);
    if (!rate) {
      missingSpecialties.push(requirement.specialty);
      continue;
    }
    chargeToClientTotal += Number(rate.chargeToClient) * requirement.quantity;
    payToWorkerTotal += Number(rate.payToWorker) * requirement.quantity;
  }

  return { chargeToClientTotal, payToWorkerTotal, missingSpecialties };
}
