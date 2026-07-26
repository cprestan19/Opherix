/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function getActivePayRuleSet(companyId: string, country: string) {
  return prisma.payRuleSet.findFirst({
    where: { companyId, country, isActive: true },
    orderBy: { effectiveFrom: "desc" },
  });
}

export function listHolidays(companyId: string, country: string) {
  return prisma.holiday.findMany({ where: { companyId, country } });
}

export function listActiveWorkersWithRate(companyId: string) {
  return prisma.worker.findMany({
    where: { companyId, status: { in: ["ACTIVE", "APPROVED"] } },
    include: { user: { select: { name: true } } },
  });
}

export function listCompletedShifts(workerId: string, periodStart: Date, periodEnd: Date) {
  return prisma.workerAssignment.findMany({
    where: {
      workerId,
      status: "ACCEPTED",
      checkInAt: { not: null, gte: periodStart },
      checkOutAt: { not: null, lte: periodEnd },
    },
    select: { checkInAt: true, checkOutAt: true },
  });
}

export function findExistingRecord(workerId: string, periodStart: Date, periodEnd: Date) {
  return prisma.paymentRecord.findFirst({
    where: { workerId, periodStart, periodEnd },
  });
}

export function createPaymentRecord(data: {
  companyId: string;
  workerId: string;
  periodStart: Date;
  periodEnd: Date;
  regularHours: number;
  overtimeHours: number;
  sundayHours: number;
  holidayHours: number;
  totalAmount: number;
}) {
  return prisma.paymentRecord.create({ data });
}

export function listPaymentRecords(companyId: string, periodStart?: Date, periodEnd?: Date) {
  return prisma.paymentRecord.findMany({
    where: {
      companyId,
      ...(periodStart && periodEnd ? { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } } : {}),
    },
    include: { worker: { select: { id: true, user: { select: { name: true } } } } },
    orderBy: { periodStart: "desc" },
  });
}

export function listPaymentRecordsForWorker(workerId: string) {
  return prisma.paymentRecord.findMany({
    where: { workerId },
    orderBy: { periodStart: "desc" },
  });
}

export function markAsPaid(id: string, paidById: string, paymentMethod: string) {
  return prisma.paymentRecord.update({
    where: { id },
    data: { status: "PAGADO", paidAt: new Date(), paidById, paymentMethod },
  });
}

export function updateBonusesAndDeductions(id: string, bonuses: number, deductions: number, totalAmount: number) {
  return prisma.paymentRecord.update({
    where: { id },
    data: { bonuses, deductions, totalAmount },
  });
}
