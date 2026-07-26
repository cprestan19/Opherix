/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import crypto from "node:crypto";

/**
 * Código de check-in por evento y día, derivado por HMAC (no requiere guardar
 * nada en la BD ni cambiar el esquema). Lo muestra el supervisor en pantalla o
 * como QR — el QR simplemente codifica un enlace profundo a la página de
 * check-in con el código precargado, así que se puede "escanear" con la
 * cámara nativa del teléfono sin necesitar una librería de lectura de QR en
 * el cliente.
 */
function secretKey() {
  return process.env.AUTH_SECRET ?? "dev-checkin-secret";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function generateCheckInCode(eventId: string): string {
  const hmac = crypto.createHmac("sha256", secretKey());
  hmac.update(`${eventId}:${todayKey()}`);
  return hmac.digest("hex").slice(0, 6).toUpperCase();
}

export function verifyCheckInCode(eventId: string, code: string): boolean {
  if (!code) return false;
  return generateCheckInCode(eventId).toLowerCase() === code.trim().toLowerCase();
}
