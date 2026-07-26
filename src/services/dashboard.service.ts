/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export interface AdminDashboardStats {
  eventsToday: number;
  workersAvailableToday: number;
  workersWorkingNow: number;
  pendingApplications: number;
  activeClients: number;
  billingThisMonth: number;
  hoursWorkedThisMonth: number;
  paymentsPending: number;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getAdminDashboardStats(companyId: string): Promise<AdminDashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    eventsToday,
    workersAvailableToday,
    workersWorkingNow,
    pendingApplications,
    activeClients,
    invoicesThisMonth,
    paymentRecordsThisMonth,
    paymentsPending,
  ] = await Promise.all([
    prisma.event.count({
      where: { companyId, startAt: { lte: todayEnd }, endAt: { gte: todayStart }, status: { notIn: ["CANCELLED", "DRAFT"] } },
    }),
    prisma.worker.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.workerAssignment.count({
      where: {
        worker: { companyId },
        status: "ACCEPTED",
        checkInAt: { not: null },
        checkOutAt: null,
      },
    }),
    prisma.worker.count({ where: { companyId, status: "PENDING_REVIEW" } }),
    prisma.client.count({ where: { companyId, isActive: true } }),
    prisma.clientInvoice.aggregate({
      where: { companyId, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.paymentRecord.aggregate({
      where: { companyId, periodStart: { gte: monthStart } },
      _sum: { regularHours: true, overtimeHours: true, sundayHours: true, holidayHours: true },
    }),
    prisma.paymentRecord.aggregate({
      where: { companyId, status: "PENDIENTE" },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalHours =
    Number(paymentRecordsThisMonth._sum.regularHours ?? 0) +
    Number(paymentRecordsThisMonth._sum.overtimeHours ?? 0) +
    Number(paymentRecordsThisMonth._sum.sundayHours ?? 0) +
    Number(paymentRecordsThisMonth._sum.holidayHours ?? 0);

  return {
    eventsToday,
    workersAvailableToday,
    workersWorkingNow,
    pendingApplications,
    activeClients,
    billingThisMonth: Number(invoicesThisMonth._sum.amount ?? 0),
    hoursWorkedThisMonth: totalHours,
    paymentsPending: Number(paymentsPending._sum.totalAmount ?? 0),
  };
}

export async function getUpcomingEvents(companyId: string, take = 5) {
  return prisma.event.findMany({
    where: { companyId, startAt: { gte: new Date() }, status: { notIn: ["CANCELLED"] } },
    orderBy: { startAt: "asc" },
    take,
    include: { client: { select: { businessName: true } } },
  });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAssignmentsByWeek(companyId: string, weeks = 7) {
  const since = startOfWeek(new Date());
  since.setDate(since.getDate() - (weeks - 1) * 7);

  const assignments = await prisma.workerAssignment.findMany({
    where: { worker: { companyId }, assignedAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { assignedAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(since);
    weekStart.setDate(since.getDate() + i * 7);
    buckets.set(weekStart.toISOString().slice(0, 10), 0);
  }

  for (const a of assignments) {
    const weekStart = startOfWeek(a.assignedAt).toISOString().slice(0, 10);
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([week, count]) => ({
    week: new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" }).format(new Date(week)),
    count,
  }));
}

export async function getRecentActivity(companyId: string, take = 6) {
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });

  return logs.map((log) => ({
    id: log.id,
    actorName: log.actor?.name ?? "Sistema",
    action: log.action,
    createdAt: log.createdAt,
  }));
}

const EVENT_TYPE_COLORS = ["#5f3cdd", "#2563eb", "#22c55e", "#f59e0b", "#94a3b8"];

export async function getEventTypeDistribution(companyId: string) {
  const events = await prisma.event.findMany({
    where: { companyId, status: { not: "CANCELLED" } },
    select: { eventType: true },
  });

  if (events.length === 0) return [];

  const counts = new Map<string, number>();
  for (const e of events) {
    const key = e.eventType?.trim() || "Otros";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const restTotal = rest.reduce((sum, [, count]) => sum + count, 0);
  if (restTotal > 0) {
    const existingOtros = top.find(([name]) => name === "Otros");
    if (existingOtros) {
      existingOtros[1] += restTotal;
    } else {
      top.push(["Otros", restTotal]);
    }
  }

  const total = events.length;
  return top.map(([name, count], i) => ({
    name,
    value: count,
    percentage: Math.round((count / total) * 100),
    color: EVENT_TYPE_COLORS[i % EVENT_TYPE_COLORS.length],
  }));
}
