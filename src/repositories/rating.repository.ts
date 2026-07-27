/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function setRating(
  assignmentId: string,
  score: number,
  comment: string | undefined,
  moderationStatus: "APPROVED" | "PENDING_REVIEW",
) {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: { ratingScore: score, ratingComment: comment, ratingModerationStatus: moderationStatus },
  });
}

export async function applyRatingToWorkerAverage(workerId: string, score: number) {
  const worker = await prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
  const newCount = worker.ratingCount + 1;
  const newAverage = (Number(worker.ratingAverage) * worker.ratingCount + score) / newCount;
  return prisma.worker.update({
    where: { id: workerId },
    data: { ratingAverage: newAverage, ratingCount: newCount },
  });
}

export function findAcceptedAssignmentsForEvent(companyId: string, eventId: string) {
  return prisma.workerAssignment.findMany({
    where: { eventId, status: "ACCEPTED", worker: { companyId, deletedAt: null } },
    select: { id: true, workerId: true, ratingScore: true },
  });
}

export function listPendingModerations(companyId: string) {
  return prisma.workerAssignment.findMany({
    where: { ratingModerationStatus: "PENDING_REVIEW", worker: { companyId, deletedAt: null } },
    select: {
      id: true,
      ratingScore: true,
      ratingComment: true,
      // `select` explícito (no `include`) para no arrastrar campos `Decimal`
      // (ratingAverage/hourlyRate del Worker) hacia el Client Component —
      // no son serializables al cruzar el límite Server→Client.
      worker: { select: { user: { select: { name: true } } } },
      event: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function findAssignmentForModeration(companyId: string, assignmentId: string) {
  return prisma.workerAssignment.findFirst({
    where: { id: assignmentId, worker: { companyId } },
  });
}

export function updateModerationStatus(assignmentId: string, status: "APPROVED" | "REJECTED") {
  return prisma.workerAssignment.update({
    where: { id: assignmentId },
    data: { ratingModerationStatus: status },
  });
}
