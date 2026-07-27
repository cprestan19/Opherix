/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export async function getWorkerDashboardStats(workerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [upcomingAssignments, pendingResponses, assignmentsThisMonth, paymentsPending] = await Promise.all([
    prisma.workerAssignment.count({
      where: { workerId, status: "ACCEPTED", event: { startAt: { gte: now } } },
    }),
    prisma.workerAssignment.count({ where: { workerId, status: "PROPOSED" } }),
    // Horas se calculan directamente de check-in/out (§6.7) — ya no de
    // PaymentRecord, que desde la parametrización por especialidad solo
    // registra montos.
    prisma.workerAssignment.findMany({
      where: { workerId, checkInAt: { gte: monthStart, not: null }, checkOutAt: { not: null } },
      select: { checkInAt: true, checkOutAt: true },
    }),
    prisma.paymentRecord.aggregate({
      where: { workerId, status: "PENDIENTE" },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalHours = assignmentsThisMonth.reduce((sum, a) => {
    const hours = (a.checkOutAt!.getTime() - a.checkInAt!.getTime()) / (1000 * 60 * 60);
    return hours > 0 ? sum + hours : sum;
  }, 0);

  return {
    upcomingAssignments,
    pendingResponses,
    hoursThisMonth: totalHours,
    paymentsPending: Number(paymentsPending._sum.totalAmount ?? 0),
  };
}

export async function getUpcomingAssignmentsForWorker(workerId: string, take = 5) {
  return prisma.workerAssignment.findMany({
    where: { workerId, status: "ACCEPTED", event: { startAt: { gte: new Date() } } },
    include: { event: { select: { title: true, startAt: true, address: true } } },
    orderBy: { event: { startAt: "asc" } },
    take,
  });
}
