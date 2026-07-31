/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Specialty } from "@/generated/prisma/enums";

export interface ClientSpecialtyRateLite {
  specialty: Specialty;
  chargeToClient: number;
}

export interface ClientChargeBreakdownRow {
  specialty: Specialty;
  quantity: number;
  chargeToClient: number | null;
  subtotal: number;
}

export interface ClientChargeEstimate {
  total: number;
  breakdown: ClientChargeBreakdownRow[];
  missingSpecialties: Specialty[];
}

/**
 * Estimado de lo que se le cobraría al cliente por un evento, calculado
 * sobre el personal SOLICITADO (EventStaffRequirement) — a diferencia de
 * `computeEventChargeTotal` (§ client-specialty-rate.service.ts), que usa el
 * personal REALMENTE asignado. En el momento de solicitar aún no hay nadie
 * asignado, así que este total es intencionalmente un estimado, nunca el
 * definitivo — la UI que lo muestre debe dejarlo claro. No toca la BD (las
 * tarifas se cargan una sola vez al entrar al formulario) para poder
 * recalcular en vivo mientras el cliente edita cantidades sin ida y vuelta
 * al servidor.
 */
export function estimateClientCharge(
  rates: ClientSpecialtyRateLite[],
  staffRequirements: { specialty: Specialty; quantity: number }[],
): ClientChargeEstimate {
  const rateBySpecialty = new Map(rates.map((r) => [r.specialty, r.chargeToClient]));

  let total = 0;
  const missingSpecialties: Specialty[] = [];
  const breakdown: ClientChargeBreakdownRow[] = [];

  for (const { specialty, quantity } of staffRequirements) {
    const chargeToClient = rateBySpecialty.get(specialty) ?? null;
    if (chargeToClient === null) {
      missingSpecialties.push(specialty);
      breakdown.push({ specialty, quantity, chargeToClient: null, subtotal: 0 });
      continue;
    }
    const subtotal = chargeToClient * quantity;
    total += subtotal;
    breakdown.push({ specialty, quantity, chargeToClient, subtotal });
  }

  return { total, breakdown, missingSpecialties };
}
