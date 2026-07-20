/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import type { Specialty } from "@/generated/prisma/enums";
import * as eventRepo from "@/repositories/event.repository";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

export class EventError extends Error {}

export interface CreateEventInput {
  title: string;
  eventType?: string;
  address: string;
  startAt: string;
  endAt: string;
  notes?: string;
  staffRequirements: { specialty: Specialty; quantity: number }[];
}

export async function createEventRequest(
  companyId: string,
  clientId: string,
  createdById: string,
  input: CreateEventInput,
) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (endAt <= startAt) {
    throw new EventError("La hora de fin debe ser posterior a la de inicio.");
  }
  if (input.staffRequirements.length === 0) {
    throw new EventError("Indica al menos un tipo de personal requerido.");
  }

  const event = await eventRepo.createEvent({
    companyId,
    clientId,
    createdById,
    title: input.title,
    eventType: input.eventType,
    address: input.address,
    startAt,
    endAt,
    notes: input.notes,
    staffRequirements: input.staffRequirements,
  });

  await logAudit({
    companyId,
    actorId: createdById,
    action: "EVENT_REQUESTED",
    entityType: "Event",
    entityId: event.id,
  });

  return event;
}

export async function assignWorkerToEvent(
  companyId: string,
  eventId: string,
  workerId: string,
  assignedById: string,
) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");

  const overlaps = await eventRepo.findOverlappingAssignments(workerId, event.startAt, event.endAt);
  if (overlaps.length > 0) {
    throw new EventError(
      `Este trabajador ya tiene una asignación que se solapa: "${overlaps[0].event.title}".`,
    );
  }

  const alreadyAssigned = event.assignments.some(
    (a) => a.workerId === workerId && a.status !== "CANCELLED" && a.status !== "REJECTED",
  );
  if (alreadyAssigned) {
    throw new EventError("Este trabajador ya está asignado a este evento.");
  }

  const assignment = await eventRepo.createAssignment(eventId, workerId, assignedById);

  await logAudit({
    companyId,
    actorId: assignedById,
    action: "WORKER_ASSIGNED",
    entityType: "WorkerAssignment",
    entityId: assignment.id,
    metadata: { eventId, workerId },
  });

  const worker = await prisma.worker.findUnique({ where: { id: workerId }, select: { userId: true } });
  if (worker) {
    await dispatchNotification({
      companyId,
      userId: worker.userId,
      type: "ASSIGNMENT_PROPOSED",
      title: "Nueva asignación de evento",
      body: `Te propusieron para "${event.title}". Revisa y confirma en tu portal.`,
      relatedEntityType: "WorkerAssignment",
      relatedEntityId: assignment.id,
    });
  }

  return assignment;
}

export async function removeAssignment(companyId: string, assignmentId: string, actorId: string) {
  const updated = await eventRepo.cancelAssignment(assignmentId);
  await logAudit({
    companyId,
    actorId,
    action: "ASSIGNMENT_CANCELLED",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
  });
  return updated;
}

export async function confirmEvent(companyId: string, eventId: string, actorId: string) {
  const updated = await eventRepo.updateEventStatus(eventId, "CONFIRMED");
  await logAudit({ companyId, actorId, action: "EVENT_CONFIRMED", entityType: "Event", entityId: eventId });
  return updated;
}

export async function cancelEvent(companyId: string, eventId: string, actorId: string, reason: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  const updated = await eventRepo.updateEventStatus(eventId, "CANCELLED", reason);
  await logAudit({
    companyId,
    actorId,
    action: "EVENT_CANCELLED",
    entityType: "Event",
    entityId: eventId,
    metadata: { reason },
  });

  if (event) {
    const affectedWorkers = event.assignments.filter(
      (a) => a.status === "PROPOSED" || a.status === "ACCEPTED",
    );
    for (const assignment of affectedWorkers) {
      await dispatchNotification({
        companyId,
        userId: assignment.worker.userId,
        type: "EVENT_CANCELLED",
        title: "Evento cancelado",
        body: `El evento "${event.title}" fue cancelado. Motivo: ${reason}`,
        relatedEntityType: "Event",
        relatedEntityId: eventId,
      });
    }
  }

  return updated;
}
