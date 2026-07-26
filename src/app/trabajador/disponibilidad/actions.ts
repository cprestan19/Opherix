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
import { toggleSlot, requestTimeOff } from "@/services/availability.service";

async function getOwnWorker() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);
  if (!worker) throw new Error("Perfil de trabajador no encontrado.");
  return { ...worker, userId: user.id };
}

export async function toggleSlotAction(dayOfWeek: number, startTime: string, endTime: string) {
  const worker = await getOwnWorker();
  const result = await toggleSlot(worker.id, dayOfWeek, startTime, endTime);
  revalidatePath("/trabajador/disponibilidad");
  return result;
}

export interface RequestTimeOffResult {
  error?: string;
}

export async function requestTimeOffAction(input: {
  type: "VACATION" | "PERMIT" | "ABSENCE";
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<RequestTimeOffResult> {
  const worker = await getOwnWorker();
  try {
    await requestTimeOff(worker.companyId, worker.id, worker.userId, input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar la solicitud." };
  }
  revalidatePath("/trabajador/disponibilidad");
  return {};
}
