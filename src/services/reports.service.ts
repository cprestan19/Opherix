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

/**
 * Horas trabajadas por semana, calculadas directamente de los check-in/out de
 * WorkerAssignment (§6.7) — ya no depende de PaymentRecord, que desde la
 * parametrización por especialidad solo registra montos, no horas.
 */
export async function getHoursWorkedByWeek(companyId: string, weeks = 8) {
  const since = startOfWeek(new Date());
  since.setDate(since.getDate() - (weeks - 1) * 7);

  const assignments = await prisma.workerAssignment.findMany({
    where: { worker: { companyId }, checkInAt: { gte: since, not: null }, checkOutAt: { not: null } },
    select: { checkInAt: true, checkOutAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(since);
    weekStart.setDate(since.getDate() + i * 7);
    buckets.set(weekStart.toISOString().slice(0, 10), 0);
  }

  for (const a of assignments) {
    const weekStart = startOfWeek(a.checkInAt!).toISOString().slice(0, 10);
    const hours = (a.checkOutAt!.getTime() - a.checkInAt!.getTime()) / (1000 * 60 * 60);
    if (hours <= 0) continue;
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
      photoUrl: true,
      ratingAverage: true,
      user: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { assignments: { _count: "desc" } },
    take,
  });

  return workers.map((w) => ({
    id: w.id,
    name: w.user.name,
    photoUrl: w.photoUrl,
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
