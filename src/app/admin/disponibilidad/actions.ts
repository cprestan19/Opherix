/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyStaff } from "@/lib/tenant";
import { reviewTimeOff } from "@/services/availability.service";
import { assignWorkerToEvent, removeAssignment, EventError } from "@/services/event.service";

export async function reviewTimeOffAction(timeOffId: string, decision: "APPROVED" | "REJECTED") {
  const { user, companyId } = await requireCompanyStaff();
  await reviewTimeOff(companyId, timeOffId, user.id, decision);
  revalidatePath("/admin/disponibilidad");
}

export interface AssignWorkerResult {
  error?: string;
}

/**
 * Asignación rápida desde la vista de Disponibilidad: el mismo
 * assignWorkerToEvent usado en /admin/eventos/[eventId] (valida solapamiento
 * y notifica al trabajador de inmediato), solo que disparado desde aquí.
 */
export async function assignWorkerToEventFromAvailabilityAction(
  eventId: string,
  workerId: string,
): Promise<AssignWorkerResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await assignWorkerToEvent(companyId, eventId, workerId, user.id);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/disponibilidad");
  return {};
}

/**
 * Quitar a un trabajador de un evento desde la vista de Disponibilidad —
 * para poder reemplazarlo por otro (asignándolo desde la fila de ese otro
 * trabajador con "Asignar evento"), sin tener que ir hasta /admin/eventos.
 */
export async function removeAssignmentFromAvailabilityAction(assignmentId: string) {
  const { user, companyId } = await requireCompanyStaff();
  await removeAssignment(companyId, assignmentId, user.id);
  revalidatePath("/admin/disponibilidad");
}
