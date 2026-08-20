/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";

// Código de llamada por país soportado (§9.6 CLAUDE.md: Panamá/Colombia/RD/
// Guatemala son los países con reglas de pago propias hoy). Se amplía junto
// con PayRuleSet cuando se sume un país nuevo.
const CALLING_CODE_BY_COUNTRY: Record<string, string> = {
  PA: "507",
  CO: "57",
  DO: "1",
  GT: "502",
};

/**
 * Normaliza un teléfono libre (User.phone / Client.contactPhone, sin
 * validación de formato en los formularios) al formato que la API de
 * WhatsApp Cloud espera: solo dígitos, con código de país. Nunca lanza —
 * si no se puede normalizar, retorna null y el canal WhatsApp simplemente
 * se omite (igual que ya pasa hoy con fcmToken ausente en push).
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined, countryIso: string): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const callingCode = CALLING_CODE_BY_COUNTRY[countryIso];
  if (!callingCode) return digits;

  return digits.startsWith(callingCode) ? digits : `${callingCode}${digits}`;
}
