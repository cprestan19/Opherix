/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
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

/**
 * Asignaciones futuras (propuestas o confirmadas) del trabajador — se usan
 * en su grilla de disponibilidad para marcar visualmente los días/franjas
 * en los que ya tiene un evento asignado, distinto de su preferencia de
 * disponibilidad genérica.
 */
export function listUpcomingAssignmentsForWorker(workerId: string) {
  return prisma.workerAssignment.findMany({
    where: {
      workerId,
      status: { in: ["PROPOSED", "ACCEPTED"] },
      event: { startAt: { gte: new Date() } },
    },
    select: {
      id: true,
      status: true,
      event: { select: { title: true, address: true, startAt: true, endAt: true } },
    },
    orderBy: { event: { startAt: "asc" } },
  });
}

export function listPendingTimeOff(companyId: string) {
  return prisma.timeOff.findMany({
    where: { status: "PENDING", worker: { companyId } },
    include: { worker: { select: { id: true, user: { select: { name: true } } } } },
    orderBy: { startDate: "asc" },
  });
}

export async function updateTimeOffStatus(companyId: string, id: string, status: "APPROVED" | "REJECTED") {
  const result = await prisma.timeOff.updateMany({
    where: { id, worker: { companyId } },
    data: { status },
  });
  if (result.count === 0) return null;
  return prisma.timeOff.findUniqueOrThrow({ where: { id } });
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
      assignments: {
        where: {
          status: { in: ["PROPOSED", "ACCEPTED"] },
          event: { startAt: { gte: new Date() } },
        },
        select: {
          id: true,
          status: true,
          event: { select: { title: true, address: true, startAt: true, endAt: true } },
        },
        orderBy: { event: { startAt: "asc" } },
      },
    },
    orderBy: { user: { name: "asc" } },
  });
}
