/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

/**
 * Cálculo de horas y monto a pagar por trabajador para un periodo (§6.8).
 * Clasificación por prioridad: feriado > domingo > (regular hasta 8h/turno,
 * excedente como hora extra) — una simplificación razonable dado que las
 * reglas exactas varían por país/empresa y son configurables vía PayRuleSet.
 */

export interface CompletedShift {
  checkInAt: Date;
  checkOutAt: Date;
}

export interface PayRules {
  overtimeMultiplier: number;
  sundayMultiplier: number;
  holidayMultiplier: number;
}

export interface HoursBreakdown {
  regularHours: number;
  overtimeHours: number;
  sundayHours: number;
  holidayHours: number;
}

const DAILY_REGULAR_THRESHOLD = 8;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function computeHoursBreakdown(shifts: CompletedShift[], holidayDates: Set<string>): HoursBreakdown {
  const breakdown: HoursBreakdown = { regularHours: 0, overtimeHours: 0, sundayHours: 0, holidayHours: 0 };

  for (const shift of shifts) {
    const hours = (shift.checkOutAt.getTime() - shift.checkInAt.getTime()) / (1000 * 60 * 60);
    if (hours <= 0) continue;

    const isHoliday = holidayDates.has(dateKey(shift.checkInAt));
    const isSunday = shift.checkInAt.getDay() === 0;

    if (isHoliday) {
      breakdown.holidayHours += hours;
    } else if (isSunday) {
      breakdown.sundayHours += hours;
    } else if (hours > DAILY_REGULAR_THRESHOLD) {
      breakdown.regularHours += DAILY_REGULAR_THRESHOLD;
      breakdown.overtimeHours += hours - DAILY_REGULAR_THRESHOLD;
    } else {
      breakdown.regularHours += hours;
    }
  }

  return breakdown;
}

export function computeTotalAmount(
  breakdown: HoursBreakdown,
  hourlyRate: number,
  rules: PayRules,
  bonuses = 0,
  deductions = 0,
): number {
  const total =
    breakdown.regularHours * hourlyRate +
    breakdown.overtimeHours * hourlyRate * rules.overtimeMultiplier +
    breakdown.sundayHours * hourlyRate * rules.sundayMultiplier +
    breakdown.holidayHours * hourlyRate * rules.holidayMultiplier +
    bonuses -
    deductions;
  return Math.max(0, Math.round(total * 100) / 100);
}
