/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

export function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const WEEKDAY_SHORT_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Domingo a sábado de la semana actual, en el mismo orden que WEEKDAY_SHORT_LABELS. */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * Los horarios de disponibilidad son una plantilla semanal recurrente (§9.6:
 * por día de la semana, no por fecha específica) — esta etiqueta solo ubica
 * al usuario ("esto es lo que aplica esta semana"), no representa un rango
 * editable ni distinto semana a semana.
 */
export function formatWeekLabel(start: Date, end: Date): string {
  const sameMonthAndYear = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endFormatter = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
  const startFormatter = sameMonthAndYear
    ? new Intl.DateTimeFormat("es", { day: "numeric" })
    : new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });
  return `Semana del ${startFormatter.format(start)} al ${endFormatter.format(end)}`;
}

/**
 * Panamá usa reloj de 12 horas — el genérico `Intl.DateTimeFormat("es", ...)`
 * (o incluso "es-PA") renderiza 24h ("15:00") o "3:00 p. m." con espacio y
 * puntos, que no es como se lee aquí. Formato compacto, ej. "3:00pm".
 */
export function formatTime12h(date: Date): string {
  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes}${period}`;
}

/**
 * Reemplazo de cualquier `Intl.DateTimeFormat("es", { ...dateOptions, hour:
 * "2-digit", minute: "2-digit" })` o `{ dateStyle, timeStyle: "short" }` —
 * `dateOptions` NO debe incluir hour/minute/timeStyle, eso lo pone
 * `formatTime12h`.
 */
export function formatDateTime12h(date: Date, dateOptions: Intl.DateTimeFormatOptions): string {
  const datePart = new Intl.DateTimeFormat("es", dateOptions).format(date);
  return `${datePart}, ${formatTime12h(date)}`;
}

export type ExpiryStatus = "none" | "valid" | "expiring_soon" | "expired";

export function getExpiryStatus(expiresAt: Date | null, warningDays = 30): ExpiryStatus {
  if (!expiresAt) return "none";
  const now = new Date();
  const daysLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= warningDays) return "expiring_soon";
  return "valid";
}
