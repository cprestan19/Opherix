/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import {
  assignWorkerToEvent,
  removeAssignment,
  confirmEvent,
  cancelEvent,
  EventError,
} from "@/services/event.service";
import { getEventDetail } from "@/repositories/event.repository";
import { issueInvoiceForEvent, InvoiceError } from "@/services/invoice.service";

export interface EventActionResult {
  error?: string;
}

export async function assignWorkerAction(eventId: string, workerId: string): Promise<EventActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  try {
    await assignWorkerToEvent(companyId, eventId, workerId, user.id);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function removeAssignmentAction(eventId: string, assignmentId: string) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await removeAssignment(companyId, assignmentId, user.id);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function confirmEventAction(eventId: string) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await confirmEvent(companyId, eventId, user.id);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function cancelEventAction(eventId: string, reason: string) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await cancelEvent(companyId, eventId, user.id, reason);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function issueInvoiceAction(eventId: string, amount: number): Promise<EventActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  const event = await getEventDetail(companyId, eventId);
  if (!event) return { error: "Evento no encontrado." };

  try {
    await issueInvoiceForEvent(
      companyId,
      user.id,
      eventId,
      event.clientId,
      event.startAt,
      event.endAt,
      amount,
    );
  } catch (error) {
    if (error instanceof InvoiceError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}
