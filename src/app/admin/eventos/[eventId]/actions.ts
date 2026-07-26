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
import {
  assignWorkerToEvent,
  removeAssignment,
  confirmEvent,
  cancelEvent,
  updateEventFull,
  archiveEvent,
  generateEventAccessLink,
  resendEventAccessLink,
  closeEventAccessLink,
  reopenEventAccessLink,
  EventError,
} from "@/services/event.service";
import { getEventDetail } from "@/repositories/event.repository";
import { issueInvoiceForEvent, InvoiceError } from "@/services/invoice.service";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";

export interface EventActionResult {
  error?: string;
}

export async function assignWorkerAction(eventId: string, workerId: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();
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
  const { user, companyId } = await requireCompanyStaff();
  await removeAssignment(companyId, assignmentId, user.id);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function confirmEventAction(eventId: string) {
  const { user, companyId } = await requireCompanyStaff();
  await confirmEvent(companyId, eventId, user.id);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function cancelEventAction(eventId: string, reason: string) {
  const { user, companyId } = await requireCompanyStaff();
  await cancelEvent(companyId, eventId, user.id, reason);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function updateEventAction(eventId: string, input: EventRequestInput): Promise<EventActionResult> {
  const parsed = eventRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireCompanyStaff();

  try {
    await updateEventFull(companyId, user.id, eventId, parsed.data);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function archiveEventAction(eventId: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await archiveEvent(companyId, user.id, eventId);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin/eventos");
  return {};
}

export interface EventAccessLinkResult {
  error?: string;
  link?: string;
  expiresAt?: Date;
}

function buildLink(companySlug: string, eventId: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/solicitar/${companySlug}/evento/${eventId}?token=${token}`;
}

export async function generateEventAccessLinkAction(eventId: string, companySlug: string): Promise<EventAccessLinkResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    const { token, expiresAt } = await generateEventAccessLink(companyId, user.id, eventId);
    revalidatePath(`/admin/eventos/${eventId}`);
    return { link: buildLink(companySlug, eventId, token), expiresAt: expiresAt ?? undefined };
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
}

export async function resendEventAccessLinkAction(eventId: string, companySlug: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await resendEventAccessLink(companyId, user.id, eventId, companySlug);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  return {};
}

export async function closeEventAccessLinkAction(eventId: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await closeEventAccessLink(companyId, user.id, eventId);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function reopenEventAccessLinkAction(eventId: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await reopenEventAccessLink(companyId, user.id, eventId);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function issueInvoiceAction(eventId: string, amount: number): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();
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
