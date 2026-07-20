/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { CheckMethod } from "@/generated/prisma/enums";

export function listAssignmentsForCheckIn(workerId: string) {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return prisma.workerAssignment.findMany({
    where: {
      workerId,
      status: "ACCEPTED",
      OR: [
        { event: { startAt: { lte: dayEnd }, endAt: { gte: dayStart } } },
        { checkInAt: { not: null }, checkOutAt: null },
      ],
    },
    include: { event: { select: { id: true, title: true, address: true, startAt: true, endAt: true } } },
    orderBy: { event: { startAt: "asc" } },
  });
}

export function findAssignmentForWorker(assignmentId: string, workerId: string) {
  return prisma.workerAssignment.findFirst({
    where: { id: assignmentId, workerId },
    include: { event: true },
  });
}

export function recordCheckIn(
  assignmentId: string,
  data: { method: CheckMethod; lat?: number; lng?: number; photoUrl?: string },
) {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: {
      checkInAt: new Date(),
      checkInMethod: data.method,
      checkInLat: data.lat,
      checkInLng: data.lng,
      checkInPhotoUrl: data.photoUrl,
    },
  });
}

export function recordCheckOut(
  assignmentId: string,
  data: { method: CheckMethod; lat?: number; lng?: number; photoUrl?: string },
) {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: {
      checkOutAt: new Date(),
      checkOutMethod: data.method,
      checkOutLat: data.lat,
      checkOutLng: data.lng,
      checkOutPhotoUrl: data.photoUrl,
    },
  });
}

export function markEventInProgress(eventId: string) {
  return prisma.event.updateMany({
    where: { id: eventId, status: { in: ["REQUESTED", "CONFIRMED"] } },
    data: { status: "IN_PROGRESS" },
  });
}

export function countOpenAssignments(eventId: string) {
  return prisma.workerAssignment.count({
    where: { eventId, status: "ACCEPTED", checkOutAt: null },
  });
}

export function markEventCompleted(eventId: string) {
  return prisma.event.updateMany({
    where: { id: eventId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED" },
  });
}

export function listCheckInsForCompanyToday(companyId: string) {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return prisma.event.findMany({
    where: { companyId, startAt: { lte: dayEnd }, endAt: { gte: dayStart }, status: { not: "CANCELLED" } },
    include: {
      assignments: {
        where: { status: "ACCEPTED" },
        include: { worker: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { startAt: "asc" },
  });
}
