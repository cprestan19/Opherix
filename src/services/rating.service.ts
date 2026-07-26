/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as ratingRepo from "@/repositories/rating.repository";
import { logAudit } from "@/lib/audit";
import { getEventForAccessToken } from "@/services/event.service";

export class RatingError extends Error {}

const MODERATION_THRESHOLD = 2; // calificaciones <= 2 quedan en revisión (§9.7)

export async function listPendingModerations(companyId: string) {
  return ratingRepo.listPendingModerations(companyId);
}

/**
 * Encuesta de satisfacción del evento (§ link del evento en
 * /solicitar/[companySlug]/evento/[eventId]) — una sola calificación +
 * comentario para "el servicio", que se aplica a cada trabajador que estuvo
 * ACCEPTED en ese evento (queda en su bitácora individual vía
 * WorkerAssignment.ratingScore/ratingComment, igual que si lo hubiera
 * calificado uno por uno). Reutiliza la moderación existente: ≤2 queda en
 * revisión antes de impactar el promedio público del trabajador.
 */
export async function submitEventRating(
  companyId: string,
  actorId: string | null,
  eventId: string,
  score: number,
  comment?: string,
) {
  if (score < 1 || score > 5) throw new RatingError("La calificación debe ser entre 1 y 5.");

  const assignments = await ratingRepo.findAcceptedAssignmentsForEvent(companyId, eventId);
  if (assignments.length === 0) {
    throw new RatingError("Este evento no tiene personal confirmado para calificar.");
  }

  const needsModeration = score <= MODERATION_THRESHOLD;
  for (const assignment of assignments) {
    if (assignment.ratingScore !== null) continue; // ya calificado, no se sobrescribe ni duplica
    await ratingRepo.setRating(assignment.id, score, comment, needsModeration ? "PENDING_REVIEW" : "APPROVED");
    if (!needsModeration) {
      await ratingRepo.applyRatingToWorkerAverage(assignment.workerId, score);
    }
  }

  await logAudit({
    companyId,
    actorId,
    action: "EVENT_RATED",
    entityType: "Event",
    entityId: eventId,
    metadata: { score, needsModeration },
  });
}

/** Variante para el link público del evento — valida el token antes de calificar. */
export async function submitEventRatingViaAccessToken(
  companyId: string,
  eventId: string,
  token: string,
  score: number,
  comment?: string,
) {
  const { event, denied } = await getEventForAccessToken(companyId, eventId, token);
  if (!event) throw new RatingError("Evento no encontrado.");
  if (denied) throw new RatingError("Este link ya no está disponible.");
  if (event.status !== "COMPLETED") {
    throw new RatingError("Solo puedes calificar el servicio una vez que el evento haya finalizado.");
  }

  return submitEventRating(companyId, null, eventId, score, comment);
}

export async function reviewRating(
  companyId: string,
  actorId: string,
  assignmentId: string,
  decision: "APPROVED" | "REJECTED",
) {
  const assignment = await ratingRepo.findAssignmentForModeration(companyId, assignmentId);
  if (!assignment) throw new RatingError("Calificación no encontrada.");

  await ratingRepo.updateModerationStatus(assignmentId, decision);

  if (decision === "APPROVED" && assignment.ratingScore !== null) {
    await ratingRepo.applyRatingToWorkerAverage(assignment.workerId, assignment.ratingScore);
  }

  await logAudit({
    companyId,
    actorId,
    action: decision === "APPROVED" ? "RATING_MODERATION_APPROVED" : "RATING_MODERATION_REJECTED",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
  });
}
