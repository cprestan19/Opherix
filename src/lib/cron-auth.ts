/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Autoriza los endpoints de Vercel Cron (§9.4). Falla CERRADO: si
 * `CRON_SECRET` no está configurado, el endpoint queda inaccesible en vez de
 * abierto públicamente (una config faltante nunca debe volverse un bypass).
 * Comparación timing-safe para no filtrar el secreto por temporización.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(authHeader);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}
