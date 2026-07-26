/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

/**
 * Detección de solapamiento de rangos fecha/hora, reutilizada del algoritmo
 * de conflictos de coach del proyecto Torneo Katana (CLAUDE.md §9.5). Un
 * trabajador no puede tener dos asignaciones activas cuyos eventos se solapen.
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
