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

  const [upcomingAssignments, pendingResponses, hoursThisMonth, paymentsPending] = await Promise.all([
    prisma.workerAssignment.count({
      where: { workerId, status: "ACCEPTED", event: { startAt: { gte: now } } },
    }),
    prisma.workerAssignment.count({ where: { workerId, status: "PROPOSED" } }),
    prisma.paymentRecord.aggregate({
      where: { workerId, periodStart: { gte: monthStart } },
      _sum: { regularHours: true, overtimeHours: true, sundayHours: true, holidayHours: true },
    }),
    prisma.paymentRecord.aggregate({
      where: { workerId, status: "PENDIENTE" },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalHours =
    Number(hoursThisMonth._sum.regularHours ?? 0) +
    Number(hoursThisMonth._sum.overtimeHours ?? 0) +
    Number(hoursThisMonth._sum.sundayHours ?? 0) +
    Number(hoursThisMonth._sum.holidayHours ?? 0);

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
