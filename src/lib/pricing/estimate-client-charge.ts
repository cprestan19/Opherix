/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

export interface ClientSpecialtyRateLite {
  specialtyId: string;
  chargeToClient: number;
}

export interface ClientChargeBreakdownRow {
  specialtyId: string;
  name: string;
  quantity: number;
  chargeToClient: number | null;
  subtotal: number;
}

export interface ClientChargeEstimate {
  total: number;
  breakdown: ClientChargeBreakdownRow[];
  missingSpecialties: { specialtyId: string; name: string }[];
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
 * al servidor. Suma cantidades de la MISMA especialidad antes de calcular —
 * nada impide que un evento tenga dos líneas de EventStaffRequirement con la
 * misma especialidad (ej. editada por separado), y sin este merge el
 * `breakdown` sacaría una fila por línea en vez de una por especialidad
 * (además de romper cualquier `key={row.specialtyId}` en la UI que lo liste).
 * Misma forma de `name` que `computeEventChargeTotal` (client-specialty-
 * rate.service.ts) a propósito — ambos alimentan el mismo EventStaffTotalsCard.
 */
export function estimateClientCharge(
  rates: ClientSpecialtyRateLite[],
  staffRequirements: { specialtyId: string; name: string; quantity: number }[],
): ClientChargeEstimate {
  const rateBySpecialtyId = new Map(rates.map((r) => [r.specialtyId, r.chargeToClient]));

  const quantityBySpecialty = new Map<string, { quantity: number; name: string }>();
  for (const { specialtyId, name, quantity } of staffRequirements) {
    const current = quantityBySpecialty.get(specialtyId);
    quantityBySpecialty.set(specialtyId, { quantity: (current?.quantity ?? 0) + quantity, name });
  }

  let total = 0;
  const missingSpecialties: { specialtyId: string; name: string }[] = [];
  const breakdown: ClientChargeBreakdownRow[] = [];

  for (const [specialtyId, { quantity, name }] of quantityBySpecialty) {
    const chargeToClient = rateBySpecialtyId.get(specialtyId) ?? null;
    if (chargeToClient === null) {
      missingSpecialties.push({ specialtyId, name });
      breakdown.push({ specialtyId, name, quantity, chargeToClient: null, subtotal: 0 });
      continue;
    }
    const subtotal = chargeToClient * quantity;
    total += subtotal;
    breakdown.push({ specialtyId, name, quantity, chargeToClient, subtotal });
  }

  return { total, breakdown, missingSpecialties };
}
