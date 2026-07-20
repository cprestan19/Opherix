/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function getWorkerIdForUser(userId: string) {
  return prisma.worker.findUnique({ where: { userId }, select: { id: true, companyId: true } });
}

export function listSlotsForWorker(workerId: string) {
  return prisma.availabilitySlot.findMany({ where: { workerId }, orderBy: { dayOfWeek: "asc" } });
}

export function findSlot(workerId: string, dayOfWeek: number, startTime: string, endTime: string) {
  return prisma.availabilitySlot.findFirst({ where: { workerId, dayOfWeek, startTime, endTime } });
}

export function createSlot(workerId: string, dayOfWeek: number, startTime: string, endTime: string) {
  return prisma.availabilitySlot.create({ data: { workerId, dayOfWeek, startTime, endTime } });
}

export function deleteSlot(id: string) {
  return prisma.availabilitySlot.delete({ where: { id } });
}

export function listTimeOffForWorker(workerId: string) {
  return prisma.timeOff.findMany({ where: { workerId }, orderBy: { startDate: "desc" } });
}

export function createTimeOff(data: {
  workerId: string;
  type: "VACATION" | "PERMIT" | "ABSENCE";
  startDate: Date;
  endDate: Date;
  reason?: string;
}) {
  return prisma.timeOff.create({ data });
}

export function listPendingTimeOff(companyId: string) {
  return prisma.timeOff.findMany({
    where: { status: "PENDING", worker: { companyId } },
    include: { worker: { include: { user: { select: { name: true } } } } },
    orderBy: { startDate: "asc" },
  });
}

export function updateTimeOffStatus(id: string, status: "APPROVED" | "REJECTED") {
  return prisma.timeOff.update({ where: { id }, data: { status } });
}

export function listWorkersWithAvailability(companyId: string) {
  return prisma.worker.findMany({
    where: { companyId, status: { in: ["APPROVED", "ACTIVE"] } },
    include: {
      user: { select: { name: true } },
      availabilitySlots: true,
      timeOffs: {
        where: { status: "APPROVED", endDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 3,
      },
    },
    orderBy: { user: { name: "asc" } },
  });
}
