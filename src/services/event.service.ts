/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import type { Specialty, AutoArchiveDelay } from "@/generated/prisma/enums";
import * as eventRepo from "@/repositories/event.repository";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { sendEmail } from "@/lib/notifications/email";
import { generateEventAccessToken, EVENT_ACCESS_REOPEN_WINDOW_MS } from "@/lib/event-access-token";
import { prisma } from "@/lib/prisma";

export class EventError extends Error {}

const AUTO_ARCHIVE_DELAY_MS: Record<Exclude<AutoArchiveDelay, "OFF">, number> = {
  IMMEDIATE: 0,
  AFTER_1H: 60 * 60 * 1000,
  AFTER_24H: 24 * 60 * 60 * 1000,
};

/**
 * Disparado por /api/cron/archive-events (Vercel Cron, §9.4). Detecta la
 * hora de finalización (endAt) de cada evento ya COMPLETED y lo archiva
 * automáticamente según el retraso configurado por el tenant en
 * Configuración → Eventos. Nunca toca eventos que no llegaron a COMPLETED
 * (CONFIRMED/IN_PROGRESS sin check-out) — esos requieren atención manual.
 */
export async function archiveEventsForCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { autoArchiveDelay: true } });
  if (!company || company.autoArchiveDelay === "OFF") return { archived: 0 };

  const cutoff = new Date(Date.now() - AUTO_ARCHIVE_DELAY_MS[company.autoArchiveDelay]);
  const candidates = await prisma.event.findMany({
    where: { companyId, status: "COMPLETED", endAt: { lte: cutoff } },
    select: { id: true },
  });

  for (const event of candidates) {
    await eventRepo.archiveEvent(event.id);
    await logAudit({
      companyId,
      actorId: null,
      action: "EVENT_AUTO_ARCHIVED",
      entityType: "Event",
      entityId: event.id,
    });
  }

  return { archived: candidates.length };
}

export interface CreateEventInput {
  title: string;
  eventType?: string;
  address: string;
  startAt: string;
  endAt: string;
  notes?: string;
  staffRequirements: { specialty: Specialty; quantity: number }[];
  // Solo aplica al crear desde el formulario público (§ selector de personal
  // en línea) — ignorado por el resto de flujos (admin, edición).
  preferredWorkerIds?: string[];
}

/**
 * Creación directa por el Administrador (a diferencia de createEventRequest,
 * que es la solicitud que hace el Cliente). El admin elige el cliente y el
 * evento nace CONFIRMED — no tiene sentido que se autoconfirme un paso
 * después de crearlo él mismo.
 */
export async function createEventByAdmin(
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
    status: "CONFIRMED",
    staffRequirements: input.staffRequirements,
  });

  await logAudit({
    companyId,
    actorId: createdById,
    action: "EVENT_CREATED_BY_ADMIN",
    entityType: "Event",
    entityId: event.id,
  });

  return event;
}

export async function updateEventFull(
  companyId: string,
  actorId: string | null,
  eventId: string,
  input: CreateEventInput,
) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.deletedAt) throw new EventError("No se puede editar un evento eliminado.");
  if (event.status === "CANCELLED" || event.status === "ARCHIVED") {
    throw new EventError("No se puede editar un evento cancelado o archivado.");
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (endAt <= startAt) {
    throw new EventError("La hora de fin debe ser posterior a la de inicio.");
  }
  if (input.staffRequirements.length === 0) {
    throw new EventError("Indica al menos un tipo de personal requerido.");
  }

  const updated = await eventRepo.updateEventDetails(eventId, {
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
    actorId,
    action: "EVENT_UPDATED",
    entityType: "Event",
    entityId: eventId,
  });

  return updated;
}

/**
 * Edición desde /solicitar/[companySlug]/estado — el solicitante sin cuenta
 * solo puede editar mientras su Event siga REQUESTED (una vez que el
 * Administrador lo confirma o rechaza, ya no debe poder cambiarlo).
 */
export async function updateEventRequestAsClient(
  companyId: string,
  clientId: string,
  eventId: string,
  input: CreateEventInput,
) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event || event.clientId !== clientId) throw new EventError("Evento no encontrado.");
  if (event.status !== "REQUESTED") {
    throw new EventError("Solo puedes editar la solicitud mientras esté pendiente de revisión.");
  }

  return updateEventFull(companyId, null, eventId, input);
}

export async function archiveEvent(companyId: string, actorId: string, eventId: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.status !== "COMPLETED") {
    throw new EventError("Solo se pueden archivar eventos ya completados.");
  }

  const updated = await eventRepo.archiveEvent(eventId);
  await logAudit({ companyId, actorId, action: "EVENT_ARCHIVED", entityType: "Event", entityId: eventId });
  return updated;
}

function buildEventAccessLink(companySlug: string, eventId: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/solicitar/${companySlug}/evento/${eventId}?token=${token}`;
}

/**
 * Genera el link único del evento si todavía no existe (idempotente — si ya
 * existe uno vigente, lo devuelve tal cual en vez de invalidarlo). Vive hasta
 * el fin del evento por defecto; el Administrador puede cerrarlo antes o
 * reabrirlo después (ver closeEventAccessLink/reopenEventAccessLink).
 */
export async function generateEventAccessLink(companyId: string, actorId: string | null, eventId: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");

  if (event.accessToken) {
    return { token: event.accessToken, expiresAt: event.accessTokenExpiresAt };
  }

  const token = generateEventAccessToken();
  await eventRepo.setEventAccessToken(eventId, token, event.endAt);
  await logAudit({ companyId, actorId, action: "EVENT_ACCESS_LINK_GENERATED", entityType: "Event", entityId: eventId });

  return { token, expiresAt: event.endAt };
}

export async function resendEventAccessLink(
  companyId: string,
  actorId: string,
  eventId: string,
  companySlug: string,
) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");

  const { token } = await generateEventAccessLink(companyId, actorId, eventId);
  const link = buildEventAccessLink(companySlug, eventId, token);

  await sendEmail(
    event.client.contactEmail,
    `Enlace de tu solicitud "${event.title}" — Opherix`,
    `Hola ${event.client.contactName},\n\n` +
      `Aquí tienes el enlace de tu solicitud "${event.title}":\n${link}\n\n` +
      `Úsalo para ver el estado y, una vez finalizado el evento, calificar el servicio.`,
    companyId,
  );

  await logAudit({ companyId, actorId, action: "EVENT_ACCESS_LINK_RESENT", entityType: "Event", entityId: eventId });
}

export async function closeEventAccessLink(companyId: string, actorId: string, eventId: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");

  await eventRepo.closeEventAccess(eventId);
  await logAudit({ companyId, actorId, action: "EVENT_ACCESS_LINK_CLOSED", entityType: "Event", entityId: eventId });
}

/** Solo tiene sentido una vez que el evento ya terminó — da 24h más desde ahora. */
export async function reopenEventAccessLink(companyId: string, actorId: string, eventId: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.endAt > new Date()) {
    throw new EventError("Solo puedes reabrir el link después de que el evento finalice.");
  }
  if (!event.accessToken) {
    throw new EventError("Este evento todavía no tiene un link generado.");
  }

  const expiresAt = new Date(Date.now() + EVENT_ACCESS_REOPEN_WINDOW_MS);
  await eventRepo.reopenEventAccess(eventId, expiresAt);
  await logAudit({ companyId, actorId, action: "EVENT_ACCESS_LINK_REOPENED", entityType: "Event", entityId: eventId });

  return { expiresAt };
}

export type EventAccessDenialReason = "not_found" | "closed" | "expired";

/**
 * Valida el link del evento (§ /solicitar/[companySlug]/evento/[eventId]) —
 * ni cookie ni sesión, solo el token de la URL. Usado tanto por la página
 * como por cada acción (ver/editar/calificar) para no confiar solo en que
 * la página ya validó.
 */
export async function getEventForAccessToken(companyId: string, eventId: string, token: string) {
  const event = await eventRepo.findEventByAccessToken(companyId, eventId, token);
  if (!event) return { event: null, denied: "not_found" as EventAccessDenialReason };
  if (event.accessClosedAt) return { event, denied: "closed" as EventAccessDenialReason };
  if (event.accessTokenExpiresAt && event.accessTokenExpiresAt < new Date()) {
    return { event, denied: "expired" as EventAccessDenialReason };
  }
  return { event, denied: null };
}

export async function updateEventRequestViaAccessToken(
  companyId: string,
  eventId: string,
  token: string,
  input: CreateEventInput,
) {
  const { event, denied } = await getEventForAccessToken(companyId, eventId, token);
  if (!event) throw new EventError("Evento no encontrado.");
  if (denied) throw new EventError("Este link ya no está disponible.");
  if (event.status !== "REQUESTED") {
    throw new EventError("Solo puedes editar la solicitud mientras esté pendiente de revisión.");
  }

  return updateEventFull(companyId, null, eventId, input);
}

/**
 * Materializa una solicitud del formulario público /solicitar/[companySlug]
 * en un Event real — sin actor humano (createdById null), porque el
 * solicitante no tiene cuenta ni sesión.
 */
export async function createEventRequest(
  companyId: string,
  clientId: string,
  createdById: string | null,
  input: CreateEventInput,
  ipAddress?: string,
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
    createdById: createdById ?? undefined,
    title: input.title,
    eventType: input.eventType,
    address: input.address,
    startAt,
    endAt,
    notes: input.notes,
    ipAddress,
    preferredWorkerIds: input.preferredWorkerIds,
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
  specialty?: Specialty,
) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.deletedAt) throw new EventError("No se puede asignar personal a un evento eliminado.");

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

  const assignment = await eventRepo.createAssignment(eventId, workerId, assignedById, specialty);

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
  const updated = await eventRepo.cancelAssignment(companyId, assignmentId);
  if (!updated) throw new EventError("Asignación no encontrada.");
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
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.deletedAt) throw new EventError("No se puede confirmar un evento eliminado.");
  const updated = await eventRepo.updateEventStatus(companyId, eventId, "CONFIRMED");
  await logAudit({ companyId, actorId, action: "EVENT_CONFIRMED", entityType: "Event", entityId: eventId });

  // El Cliente ya no tiene cuenta/portal (§ /solicitar/[companySlug]) — el
  // correo es la única forma en que se entera de que su solicitud avanzó.
  if (event) {
    await sendEmail(
      event.client.contactEmail,
      `Tu solicitud "${event.title}" fue confirmada — Opherix`,
      `Hola ${event.client.contactName},\n\n` +
        `Confirmamos tu solicitud de personal para "${event.title}". Ya estamos asignando al equipo.\n\n` +
        `Puedes ver el estado en cualquier momento con el mismo enlace que usaste para solicitar.`,
      companyId,
    );
  }

  return updated;
}

/**
 * Marca el evento como completado manualmente — a diferencia del auto-
 * complete que dispara checkin.repository.ts cuando el último trabajador
 * hace check-out, esto lo puede forzar el Administrador aunque no se haya
 * usado check-in/check-out. El resto (factura al cliente + pagos al
 * personal) lo orquesta la action layer (§ admin/eventos/[eventId]/actions.ts)
 * llamando a computeEventChargeTotal/setEventInvoiceAmount/
 * generatePaymentsForEvent, no aquí, para evitar un import circular con
 * invoice.service.ts (que ya importa de este archivo).
 */
export async function completeEvent(companyId: string, actorId: string, eventId: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  if (event.deletedAt) throw new EventError("No se puede completar un evento eliminado.");
  if (event.status !== "CONFIRMED" && event.status !== "IN_PROGRESS") {
    throw new EventError("Solo puedes completar un evento confirmado o en curso.");
  }

  const updated = await eventRepo.updateEventStatus(companyId, eventId, "COMPLETED");
  await logAudit({ companyId, actorId, action: "EVENT_COMPLETED", entityType: "Event", entityId: eventId });
  return updated;
}

export async function cancelEvent(companyId: string, eventId: string, actorId: string, reason: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");
  const updated = await eventRepo.updateEventStatus(companyId, eventId, "CANCELLED", reason);
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

    await sendEmail(
      event.client.contactEmail,
      `Tu solicitud "${event.title}" fue rechazada — Opherix`,
      `Hola ${event.client.contactName},\n\n` +
        `Lamentablemente no pudimos confirmar tu solicitud de personal para "${event.title}".\n` +
        `Motivo: ${reason}\n\n` +
        `Si quieres, puedes enviar una nueva solicitud con otra fecha u horario.`,
      companyId,
    );
  }

  return updated;
}

/**
 * Eliminación lógica (soft-delete, § CLAUDE.md §4/§9.9 — nunca borrado
 * físico): distinto de cancelar/archivar, oculta el evento de las listas
 * Activos y Archivados por igual. Reversible desde la vista de "Eliminados".
 */
export async function deleteEvent(companyId: string, actorId: string, eventId: string, reason: string) {
  const event = await eventRepo.getEventDetail(companyId, eventId);
  if (!event) throw new EventError("Evento no encontrado.");

  const updated = await eventRepo.softDeleteEvent(companyId, eventId, reason);
  if (!updated) throw new EventError("Evento no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "EVENT_DELETED",
    entityType: "Event",
    entityId: eventId,
    metadata: { reason },
  });

  const affectedWorkers = event.assignments.filter((a) => a.status === "PROPOSED" || a.status === "ACCEPTED");
  for (const assignment of affectedWorkers) {
    await dispatchNotification({
      companyId,
      userId: assignment.worker.userId,
      type: "EVENT_CANCELLED",
      title: "Evento eliminado",
      body: `El evento "${event.title}" fue eliminado. Motivo: ${reason}`,
      relatedEntityType: "Event",
      relatedEntityId: eventId,
    });
  }

  return updated;
}

export async function restoreEvent(companyId: string, actorId: string, eventId: string) {
  const updated = await eventRepo.restoreEvent(companyId, eventId);
  if (!updated) throw new EventError("Evento no encontrado.");

  await logAudit({ companyId, actorId, action: "EVENT_RESTORED", entityType: "Event", entityId: eventId });
  return updated;
}

export async function listDeletedEvents(companyId: string) {
  return eventRepo.listDeletedEvents(companyId);
}
