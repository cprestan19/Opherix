/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getHoursWorkedByWeek(companyId: string, weeks = 8) {
  const since = startOfWeek(new Date());
  since.setDate(since.getDate() - (weeks - 1) * 7);

  const records = await prisma.paymentRecord.findMany({
    where: { companyId, periodStart: { gte: since } },
    select: { periodStart: true, regularHours: true, overtimeHours: true, sundayHours: true, holidayHours: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(since);
    weekStart.setDate(since.getDate() + i * 7);
    buckets.set(weekStart.toISOString().slice(0, 10), 0);
  }

  for (const record of records) {
    const weekStart = startOfWeek(record.periodStart).toISOString().slice(0, 10);
    const hours =
      Number(record.regularHours) +
      Number(record.overtimeHours) +
      Number(record.sundayHours) +
      Number(record.holidayHours);
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + hours);
  }

  return Array.from(buckets.entries()).map(([week, hours]) => ({
    week: new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" }).format(new Date(week)),
    hours: Math.round(hours * 10) / 10,
  }));
}

export async function getTopWorkers(companyId: string, take = 8) {
  const workers = await prisma.worker.findMany({
    where: { companyId, status: { in: ["ACTIVE", "APPROVED"] } },
    select: {
      id: true,
      ratingAverage: true,
      user: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { assignments: { _count: "desc" } },
    take,
  });

  return workers.map((w) => ({
    name: w.user.name,
    assignments: w._count.assignments,
    rating: Number(w.ratingAverage),
  }));
}

export async function getEventStatusSummary(companyId: string) {
  const statuses = ["REQUESTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
  const counts = await Promise.all(
    statuses.map((status) => prisma.event.count({ where: { companyId, status } })),
  );
  return statuses.map((status, i) => ({ status, count: counts[i] }));
}

export async function getPunctualitySummary(companyId: string) {
  const assignments = await prisma.workerAssignment.findMany({
    where: { worker: { companyId }, checkInAt: { not: null } },
    select: { checkInAt: true, event: { select: { startAt: true } } },
    take: 500,
    orderBy: { checkInAt: "desc" },
  });

  if (assignments.length === 0) return { averageMinutesLate: 0, onTimeRate: 0, sampleSize: 0 };

  const diffsMinutes = assignments.map(
    (a) => (a.checkInAt!.getTime() - a.event.startAt.getTime()) / (1000 * 60),
  );
  const averageMinutesLate = diffsMinutes.reduce((sum, d) => sum + d, 0) / diffsMinutes.length;
  const onTime = diffsMinutes.filter((d) => d <= 10).length;

  return {
    averageMinutesLate: Math.round(averageMinutesLate),
    onTimeRate: Math.round((onTime / diffsMinutes.length) * 100),
    sampleSize: assignments.length,
  };
}

export async function getAbsenceSummary(companyId: string) {
  const [absences, rejectedAssignments] = await Promise.all([
    prisma.timeOff.count({ where: { worker: { companyId }, type: "ABSENCE", status: "APPROVED" } }),
    prisma.workerAssignment.count({ where: { worker: { companyId }, status: "REJECTED" } }),
  ]);
  return { absences, rejectedAssignments };
}
