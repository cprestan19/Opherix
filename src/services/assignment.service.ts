/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as eventRepo from "@/repositories/event.repository";
import { logAudit } from "@/lib/audit";

export class AssignmentError extends Error {}

export async function respondToAssignment(
  companyId: string,
  assignmentId: string,
  workerId: string,
  decision: "ACCEPTED" | "REJECTED",
  rejectReason?: string,
) {
  const assignment = await eventRepo.findAssignmentForWorker(assignmentId, workerId);
  if (!assignment) throw new AssignmentError("Asignación no encontrada.");
  if (assignment.status !== "PROPOSED") {
    throw new AssignmentError("Esta asignación ya fue respondida.");
  }

  const updated = await eventRepo.respondToAssignment(assignmentId, decision, rejectReason);

  await logAudit({
    companyId,
    actorId: workerId,
    action: decision === "ACCEPTED" ? "ASSIGNMENT_ACCEPTED" : "ASSIGNMENT_REJECTED",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
  });

  return updated;
}
