/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Asignaciones ACCEPTED con check-in/out dentro del periodo, para calcular
 * el pago por especialidad (§ ClientSpecialtyRate.payToWorker) — ya no se
 * calcula por hora trabajada.
 */
export function listAcceptedAssignmentsForPeriod(companyId: string, periodStart: Date, periodEnd: Date) {
  return prisma.workerAssignment.findMany({
    where: {
      status: "ACCEPTED",
      checkInAt: { not: null, gte: periodStart },
      checkOutAt: { not: null, lte: periodEnd },
      event: { companyId },
    },
    select: {
      workerId: true,
      specialty: true,
      event: { select: { clientId: true } },
    },
  });
}

export function listClientSpecialtyRates(companyId: string) {
  return prisma.clientSpecialtyRate.findMany({ where: { companyId } });
}

export function findExistingRecord(workerId: string, periodStart: Date, periodEnd: Date) {
  return prisma.paymentRecord.findFirst({
    where: { workerId, periodStart, periodEnd },
  });
}

export function createPaymentRecord(data: {
  companyId: string;
  workerId: string;
  eventId?: string;
  periodStart: Date;
  periodEnd: Date;
  assignmentCount: number;
  totalAmount: number;
}) {
  return prisma.paymentRecord.create({ data });
}

export function listPaymentRecords(
  companyId: string,
  periodStart?: Date,
  periodEnd?: Date,
  workerId?: string,
) {
  return prisma.paymentRecord.findMany({
    where: {
      companyId,
      ...(periodStart && periodEnd ? { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } } : {}),
      ...(workerId ? { workerId } : {}),
    },
    include: {
      worker: { select: { id: true, user: { select: { name: true } } } },
      event: { select: { title: true } },
    },
    orderBy: { periodStart: "desc" },
  });
}

/** Estadísticas del periodo filtrado — para el resumen arriba de la tabla de pagos. */
export async function getPaymentStats(
  companyId: string,
  periodStart?: Date,
  periodEnd?: Date,
  workerId?: string,
) {
  const baseWhere = {
    companyId,
    ...(periodStart && periodEnd ? { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } } : {}),
    ...(workerId ? { workerId } : {}),
  };

  const [pending, paid] = await Promise.all([
    prisma.paymentRecord.aggregate({
      where: { ...baseWhere, status: "PENDIENTE" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.paymentRecord.aggregate({
      where: { ...baseWhere, status: "PAGADO" },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    pendingTotal: Number(pending._sum.totalAmount ?? 0),
    pendingCount: pending._count,
    paidTotal: Number(paid._sum.totalAmount ?? 0),
    paidCount: paid._count,
  };
}

export function listPaymentRecordsForWorker(workerId: string) {
  return prisma.paymentRecord.findMany({
    where: { workerId },
    include: { event: { select: { title: true } } },
    orderBy: { periodStart: "desc" },
  });
}

export async function markAsPaid(companyId: string, id: string, paidById: string, paymentMethod: string) {
  const result = await prisma.paymentRecord.updateMany({
    where: { id, companyId },
    data: { status: "PAGADO", paidAt: new Date(), paidById, paymentMethod },
  });
  if (result.count === 0) return null;
  return prisma.paymentRecord.findUniqueOrThrow({ where: { id } });
}

export async function updateBonusesAndDeductions(
  companyId: string,
  id: string,
  bonuses: number,
  deductions: number,
  totalAmount: number,
) {
  const result = await prisma.paymentRecord.updateMany({
    where: { id, companyId },
    data: { bonuses, deductions, totalAmount },
  });
  if (result.count === 0) return null;
  return prisma.paymentRecord.findUniqueOrThrow({ where: { id } });
}
