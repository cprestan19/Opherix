/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { respondToAssignment, AssignmentError } from "@/services/assignment.service";

export interface RespondResult {
  error?: string;
}

export async function respondToAssignmentAction(
  assignmentId: string,
  decision: "ACCEPTED" | "REJECTED",
  rejectReason?: string,
): Promise<RespondResult> {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);
  if (!worker) return { error: "Perfil de trabajador no encontrado." };

  try {
    await respondToAssignment(worker.companyId, assignmentId, worker.id, decision, rejectReason);
  } catch (error) {
    if (error instanceof AssignmentError) return { error: error.message };
    throw error;
  }

  revalidatePath("/trabajador/asignaciones");
  return {};
}
