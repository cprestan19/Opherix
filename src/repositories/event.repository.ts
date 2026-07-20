/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Specialty } from "@/generated/prisma/enums";

export function createEvent(data: {
  companyId: string;
  clientId: string;
  createdById: string;
  title: string;
  eventType?: string;
  address: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
  staffRequirements: { specialty: Specialty; quantity: number }[];
}) {
  const { staffRequirements, ...eventFields } = data;
  return prisma.event.create({
    data: {
      ...eventFields,
      status: "REQUESTED",
      staffRequirements: { create: staffRequirements },
    },
    include: { staffRequirements: true },
  });
}

export function listEventsForClient(companyId: string, clientId: string) {
  return prisma.event.findMany({
    where: { companyId, clientId },
    include: {
      staffRequirements: true,
      assignments: {
        select: {
          id: true,
          status: true,
          ratingScore: true,
          worker: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { startAt: "desc" },
  });
}

export function listEventsForCompany(companyId: string) {
  return prisma.event.findMany({
    where: { companyId, status: { not: "CANCELLED" } },
    include: {
      client: { select: { businessName: true } },
      staffRequirements: true,
      assignments: {
        select: {
          id: true,
          status: true,
          workerId: true,
          worker: { select: { photoUrl: true, user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { startAt: "asc" },
  });
}

export function getEventDetail(companyId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, companyId },
    include: {
      client: { select: { businessName: true, contactName: true, contactPhone: true } },
      staffRequirements: true,
      assignments: {
        include: {
          worker: { include: { user: { select: { name: true, phone: true } } } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
}

export function updateEventStatus(
  eventId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "IN_PROGRESS",
  cancelReason?: string,
) {
  return prisma.event.update({
    where: { id: eventId },
    data: { status, cancelReason },
  });
}

export function findOverlappingAssignments(workerId: string, startAt: Date, endAt: Date) {
  return prisma.workerAssignment.findMany({
    where: {
      workerId,
      status: { in: ["PROPOSED", "ACCEPTED"] },
      event: {
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    },
    include: { event: { select: { title: true, startAt: true, endAt: true } } },
  });
}

export function createAssignment(eventId: string, workerId: string, assignedById: string) {
  return prisma.workerAssignment.create({
    data: { eventId, workerId, assignedById, status: "PROPOSED" },
  });
}

export function cancelAssignment(assignmentId: string) {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: { status: "CANCELLED" },
  });
}

export function listAssignmentsForWorker(workerId: string) {
  return prisma.workerAssignment.findMany({
    where: { workerId, status: { not: "CANCELLED" } },
    include: { event: { include: { client: { select: { businessName: true } } } } },
    orderBy: { event: { startAt: "asc" } },
  });
}

export function respondToAssignment(
  assignmentId: string,
  decision: "ACCEPTED" | "REJECTED",
  rejectReason?: string,
) {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: { status: decision, respondedAt: new Date(), rejectReason },
  });
}

export function findAssignmentForWorker(assignmentId: string, workerId: string) {
  return prisma.workerAssignment.findFirst({ where: { id: assignmentId, workerId } });
}

export function findAvailableWorkersForSpecialty(companyId: string, specialty: Specialty) {
  return prisma.worker.findMany({
    where: { companyId, status: "ACTIVE", specialties: { has: specialty } },
    include: { user: { select: { name: true } } },
    orderBy: { ratingAverage: "desc" },
  });
}
