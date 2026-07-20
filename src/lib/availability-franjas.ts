/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

export interface Franja {
  key: string;
  label: string;
  start: string;
  end: string;
}

export const FRANJAS: Franja[] = [
  { key: "morning", label: "Mañana", start: "06:00", end: "12:00" },
  { key: "afternoon", label: "Tarde", start: "12:00", end: "18:00" },
  { key: "evening", label: "Noche", start: "18:00", end: "23:59" },
];
