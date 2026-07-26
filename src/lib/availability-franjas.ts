/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
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

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Para cada (día de semana, franja) determina si hay al menos un evento
 * asignado (futuro) que caiga ahí — el día se deriva de la fecha real del
 * evento, la franja se compara por hora del día. Se usa tanto en la grilla
 * editable del trabajador como en la vista de solo lectura del admin, para
 * que ambas muestren el mismo criterio de "ocupado".
 */
export function computeOccupiedFranjaKeys(ranges: { startAt: Date; endAt: Date }[]): Set<string> {
  const keys = new Set<string>();
  for (const range of ranges) {
    const dayOfWeek = range.startAt.getDay();
    const eventStartMin = range.startAt.getHours() * 60 + range.startAt.getMinutes();
    const sameDay = range.endAt.getDate() === range.startAt.getDate();
    const eventEndMin = sameDay ? range.endAt.getHours() * 60 + range.endAt.getMinutes() : 24 * 60;
    for (const franja of FRANJAS) {
      const franjaStart = timeToMinutes(franja.start);
      const franjaEnd = timeToMinutes(franja.end);
      if (eventStartMin < franjaEnd && franjaStart < eventEndMin) {
        keys.add(`${dayOfWeek}-${franja.key}`);
      }
    }
  }
  return keys;
}
