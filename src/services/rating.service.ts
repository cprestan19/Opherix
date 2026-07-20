/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as ratingRepo from "@/repositories/rating.repository";
import { logAudit } from "@/lib/audit";

export class RatingError extends Error {}

const MODERATION_THRESHOLD = 2; // calificaciones <= 2 quedan en revisión (§9.7)

export async function submitRating(
  companyId: string,
  clientId: string,
  actorId: string,
  assignmentId: string,
  score: number,
  comment?: string,
) {
  if (score < 1 || score > 5) throw new RatingError("La calificación debe ser entre 1 y 5.");

  const assignment = await ratingRepo.findAssignmentForRating(assignmentId, companyId, clientId);
  if (!assignment) throw new RatingError("Solo puedes calificar asignaciones de eventos completados.");
  if (assignment.ratingScore !== null) throw new RatingError("Esta asignación ya fue calificada.");

  const needsModeration = score <= MODERATION_THRESHOLD;
  await ratingRepo.setRating(assignmentId, score, comment, needsModeration ? "PENDING_REVIEW" : "APPROVED");

  if (!needsModeration) {
    await ratingRepo.applyRatingToWorkerAverage(assignment.workerId, score);
  }

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_RATED",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
    metadata: { score, needsModeration },
  });
}

export async function listPendingModerations(companyId: string) {
  return ratingRepo.listPendingModerations(companyId);
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
