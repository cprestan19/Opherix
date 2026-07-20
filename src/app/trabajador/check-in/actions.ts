/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { checkIn, checkOut, CheckInError, type CheckMethodPayload } from "@/services/checkin.service";

export interface CheckActionResult {
  error?: string;
}

async function resolveWorker() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);
  if (!worker) throw new Error("Perfil de trabajador no encontrado.");
  return worker;
}

export async function checkInAction(
  assignmentId: string,
  payload: CheckMethodPayload,
): Promise<CheckActionResult> {
  const worker = await resolveWorker();
  try {
    await checkIn(worker.companyId, worker.id, assignmentId, payload);
  } catch (error) {
    if (error instanceof CheckInError) return { error: error.message };
    throw error;
  }
  revalidatePath("/trabajador/check-in");
  return {};
}

export async function checkOutAction(
  assignmentId: string,
  payload: CheckMethodPayload,
): Promise<CheckActionResult> {
  const worker = await resolveWorker();
  try {
    await checkOut(worker.companyId, worker.id, assignmentId, payload);
  } catch (error) {
    if (error instanceof CheckInError) return { error: error.message };
    throw error;
  }
  revalidatePath("/trabajador/check-in");
  return {};
}
