/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";

export const EVENT_ACCESS_REOPEN_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

export function generateEventAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
