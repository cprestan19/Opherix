/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Specialty, EventStatus } from "@/generated/prisma/enums";

export function createEvent(data: {
  companyId: string;
  clientId: string;
  // Opcional: los eventos que nacen de /solicitar/[companySlug] no tienen
  // ningún User que los cree (el solicitante no tiene cuenta).
  createdById?: string;
  title: string;
  eventType?: string;
  address: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
  status?: EventStatus;
  // Solo se llena en eventos creados desde /solicitar/[companySlug] — usado
  // únicamente para el rate limiting por IP de ese formulario público.
  ipAddress?: string;
  // Preferencia opcional del selector de personal en línea del formulario
  // público — no crea asignaciones, solo prioriza a quién debería asignar el Administrador.
  preferredWorkerIds?: string[];
  staffRequirements: { specialty: Specialty; quantity: number }[];
}) {
  const { staffRequirements, status, ...eventFields } = data;
  return prisma.event.create({
    data: {
      ...eventFields,
      status: status ?? "REQUESTED",
      staffRequirements: { create: staffRequirements },
    },
    include: { staffRequirements: true },
  });
}

/** Rate limiting del formulario público /solicitar/[companySlug] (§ reglas de seguridad). */
export function countRecentPublicRequestsByEmail(companyId: string, contactEmail: string, since: Date) {
  return prisma.event.count({
    where: {
      companyId,
      createdAt: { gte: since },
      client: { contactEmail: { equals: contactEmail, mode: "insensitive" } },
    },
  });
}

export function countRecentPublicRequestsByIp(companyId: string, ipAddress: string, since: Date) {
  return prisma.event.count({ where: { companyId, ipAddress, createdAt: { gte: since } } });
}

export function updateEventDetails(
  eventId: string,
  data: {
    title: string;
    eventType?: string;
    address: string;
    startAt: Date;
    endAt: Date;
    notes?: string;
    staffRequirements: { specialty: Specialty; quantity: number }[];
  },
) {
  const { staffRequirements, ...eventFields } = data;
  return prisma.$transaction(async (tx) => {
    await tx.eventStaffRequirement.deleteMany({ where: { eventId } });
    return tx.event.update({
      where: { id: eventId },
      data: {
        ...eventFields,
        staffRequirements: { create: staffRequirements },
      },
      include: { staffRequirements: true },
    });
  });
}

export function archiveEvent(eventId: string) {
  return prisma.event.update({ where: { id: eventId }, data: { status: "ARCHIVED", archivedAt: new Date() } });
}

export function listDeletedEvents(companyId: string) {
  return prisma.event.findMany({
    where: { companyId, deletedAt: { not: null } },
    include: { client: { select: { businessName: true } } },
    orderBy: { deletedAt: "desc" },
  });
}

export async function softDeleteEvent(companyId: string, eventId: string, reason: string) {
  const result = await prisma.event.updateMany({
    where: { id: eventId, companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedReason: reason },
  });
  if (result.count === 0) return null;
  return prisma.event.findUniqueOrThrow({ where: { id: eventId } });
}

export async function restoreEvent(companyId: string, eventId: string) {
  const result = await prisma.event.updateMany({
    where: { id: eventId, companyId, deletedAt: { not: null } },
    data: { deletedAt: null, deletedReason: null },
  });
  if (result.count === 0) return null;
  return prisma.event.findUniqueOrThrow({ where: { id: eventId } });
}

export function listEventsForClient(companyId: string, clientId: string) {
  return prisma.event.findMany({
    where: { companyId, clientId, deletedAt: null },
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

export function listEventsForCompany(companyId: string, options: { archived?: boolean } = {}) {
  return prisma.event.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: options.archived ? "ARCHIVED" : { notIn: ["CANCELLED", "ARCHIVED"] },
    },
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
    orderBy: { startAt: options.archived ? "desc" : "asc" },
  });
}

/**
 * Eventos a los que todavía tiene sentido asignar personal — usado por el
 * modal de asignación rápida desde /admin/disponibilidad.
 */
export function listAssignableEvents(companyId: string) {
  return prisma.event.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
      endAt: { gte: new Date() },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      client: { select: { businessName: true } },
    },
    orderBy: { startAt: "asc" },
  });
}

/** Resumen de los trabajadores que el Cliente marcó como preferidos al solicitar (§ event.preferredWorkerIds). */
export function listPreferredWorkerSummaries(companyId: string, workerIds: string[]) {
  if (workerIds.length === 0) return Promise.resolve([]);
  return prisma.worker.findMany({
    where: { id: { in: workerIds }, companyId },
    select: { id: true, photoUrl: true, user: { select: { name: true } } },
  });
}

export function getEventDetail(companyId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, companyId },
    include: {
      client: { select: { businessName: true, contactName: true, contactPhone: true, contactEmail: true } },
      staffRequirements: true,
      assignments: {
        include: {
          // `select` (no `include`) para no arrastrar campos `Decimal` del
          // Worker (ratingAverage) — no son serializables hacia el Client
          // Component `AssignmentPanel`, que solo necesita esto.
          worker: { select: { id: true, userId: true, photoUrl: true, user: { select: { name: true, phone: true } } } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
}

export async function updateEventStatus(
  companyId: string,
  eventId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "IN_PROGRESS",
  cancelReason?: string,
) {
  const result = await prisma.event.updateMany({
    where: { id: eventId, companyId },
    data: { status, cancelReason },
  });
  if (result.count === 0) return null;
  return prisma.event.findUniqueOrThrow({ where: { id: eventId } });
}

export function setEventAccessToken(eventId: string, token: string, expiresAt: Date) {
  return prisma.event.update({
    where: { id: eventId },
    data: { accessToken: token, accessTokenExpiresAt: expiresAt, accessClosedAt: null },
  });
}

export function closeEventAccess(eventId: string) {
  return prisma.event.update({ where: { id: eventId }, data: { accessClosedAt: new Date() } });
}

export function reopenEventAccess(eventId: string, expiresAt: Date) {
  return prisma.event.update({
    where: { id: eventId },
    data: { accessClosedAt: null, accessTokenExpiresAt: expiresAt },
  });
}

/**
 * Búsqueda por el token del link público del evento (§ /solicitar/[companySlug]/evento/[eventId]) —
 * no depende de sesión ni cookie, cualquiera con el link y el token vigente entra.
 */
export function findEventByAccessToken(companyId: string, eventId: string, token: string) {
  return prisma.event.findFirst({
    where: { id: eventId, companyId, accessToken: token, deletedAt: null },
    include: {
      client: { select: { businessName: true, contactName: true, contactEmail: true, contactPhone: true } },
      staffRequirements: true,
      assignments: {
        where: { status: "ACCEPTED" },
        select: {
          id: true,
          ratingScore: true,
          ratingComment: true,
          worker: { select: { id: true, user: { select: { name: true } } } },
        },
      },
    },
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

export function createAssignment(
  eventId: string,
  workerId: string,
  assignedById: string,
  specialty?: Specialty,
) {
  return prisma.workerAssignment.create({
    data: { eventId, workerId, assignedById, status: "PROPOSED", specialty },
  });
}

export async function cancelAssignment(companyId: string, assignmentId: string) {
  const result = await prisma.workerAssignment.updateMany({
    where: { id: assignmentId, event: { companyId } },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) return null;
  return prisma.workerAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
}

export function listAssignmentsForWorker(workerId: string) {
  return prisma.workerAssignment.findMany({
    where: { workerId, status: { not: "CANCELLED" }, event: { deletedAt: null } },
    include: {
      event: {
        include: {
          client: { select: { businessName: true, contactName: true, contactPhone: true } },
        },
      },
    },
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
  return prisma.workerAssignment.findFirst({
    where: { id: assignmentId, workerId, event: { deletedAt: null } },
  });
}

export function findAvailableWorkersForSpecialty(companyId: string, specialty: Specialty) {
  return prisma.worker.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE", specialties: { has: specialty } },
    // `select` (no `include`) — igual que en getEventDetail: evita arrastrar
    // campos `Decimal` del Worker (ratingAverage), que no son serializables
    // hacia el Client Component `AssignmentPanel`.
    select: { id: true, photoUrl: true, user: { select: { name: true } } },
    orderBy: { ratingAverage: "desc" },
  });
}
