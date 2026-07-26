/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";

// "Recuérdame sin contraseña" para /solicitar/[companySlug]/estado — el
// solicitante vuelve a ver el estado de sus eventos sin volver a llenar el
// formulario mientras el token (guardado como cookie httpOnly) no expire.
export const CLIENT_ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
export const CLIENT_ACCESS_COOKIE_NAME = "opherix_client_access";

export function generateClientAccessToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashClientAccessToken(token);
  const expiresAt = new Date(Date.now() + CLIENT_ACCESS_TOKEN_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashClientAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
