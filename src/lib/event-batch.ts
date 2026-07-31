/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

// Un archivo "use server" solo puede exportar funciones async (Next.js lo
// exige) — esta constante vive aparte para poder importarse tanto desde la
// server action (cliente/[token]/actions.ts) como desde el wizard de
// cliente (cliente/[token]/new-event-form.tsx) sin romper esa regla.
export const MAX_EVENTS_PER_BATCH = 20;
