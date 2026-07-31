/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";

/**
 * Rate limiter en memoria, por clave (ej. IP), ventana deslizante. Best-effort
 * a propósito: en Vercel serverless cada instancia tiene su propio Map, así
 * que no es una cota dura multi-instancia — pero sí frena ráfagas de abuso
 * desde una misma instancia/IP sin necesitar Redis ni una tabla nueva. Usarlo
 * solo para endpoints públicos sin sesión donde ya no hay otro control (ver
 * `/api/imagekit/auth`); las acciones de negocio con sesión ya se auditan y
 * limitan por otras vías (ver `public-event-request.service.ts` para el
 * equivalente persistente en BD).
 */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= maxHits) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function getClientIpFromHeaderList(headerList: Headers): string {
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown"
  );
}

export function getClientIp(request: Request): string {
  return getClientIpFromHeaderList(request.headers);
}
