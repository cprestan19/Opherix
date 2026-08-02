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
  completeEvent,
  updateEventFull,
  archiveEvent,
  deleteEvent,
  restoreEvent,
  generateEventAccessLink,
  resendEventAccessLink,
  closeEventAccessLink,
  reopenEventAccessLink,
  EventError,
} from "@/services/event.service";
import { getEventDetail } from "@/repositories/event.repository";
import { computeEventChargeTotal } from "@/services/client-specialty-rate.service";
import { setEventInvoiceAmount, InvoiceError } from "@/services/invoice.service";
import { generatePaymentsForEvent, PaymentError } from "@/services/payment.service";
import { getEventQuoteWhatsAppLink, QuoteError } from "@/services/quote.service";
import { getWorkOrderWhatsAppLink, WorkOrderError } from "@/services/work-order.service";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import type { Specialty } from "@/generated/prisma/enums";

export interface EventActionResult {
  error?: string;
}

export async function assignWorkerAction(
  eventId: string,
  workerId: string,
  specialty?: Specialty,
): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();
  try {
    await assignWorkerToEvent(companyId, eventId, workerId, user.id, specialty);
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

export interface CompleteEventResult extends EventActionResult {
  chargeToClientTotal?: number;
  workersNotified?: number;
}

/**
 * "Marcar completado" (§ /admin/eventos) — orquesta tres pasos con la MISMA
 * fuente de verdad (las asignaciones activas del evento, no lo
 * originalmente solicitado): pasa el evento a COMPLETED, emite/actualiza la
 * factura al cliente con el total calculado, y genera los pagos pendientes
 * al personal (uno por trabajador, notificándolo). Vive en la action layer
 * (no en event.service.ts) para poder llamar a invoice.service.ts y
 * payment.service.ts sin crear un import circular con event.service.ts.
 */
export async function completeEventAction(eventId: string): Promise<CompleteEventResult> {
  const { user, companyId } = await requireCompanyStaff();

  const event = await getEventDetail(companyId, eventId);
  if (!event) return { error: "Evento no encontrado." };

  try {
    await completeEvent(companyId, user.id, eventId);

    const staffTotals = await computeEventChargeTotal(companyId, event.clientId, event.assignments);
    if (staffTotals.chargeToClientTotal > 0) {
      await setEventInvoiceAmount(
        companyId,
        user.id,
        eventId,
        event.clientId,
        event.startAt,
        event.endAt,
        staffTotals.chargeToClientTotal,
      );
    }

    const paymentsResult = await generatePaymentsForEvent(
      companyId,
      user.id,
      eventId,
      event.title,
      event.clientId,
      event.startAt,
      event.endAt,
      event.assignments,
    );

    revalidatePath(`/admin/eventos/${eventId}`);
    revalidatePath("/admin/pagos");
    return { chargeToClientTotal: staffTotals.chargeToClientTotal, workersNotified: paymentsResult.created };
  } catch (error) {
    if (error instanceof EventError || error instanceof InvoiceError || error instanceof PaymentError) {
      return { error: error.message };
    }
    throw error;
  }
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

export async function deleteEventAction(eventId: string, reason: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await deleteEvent(companyId, user.id, eventId, reason);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin/eventos");
  return {};
}

export async function restoreEventAction(eventId: string): Promise<EventActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await restoreEvent(companyId, user.id, eventId);
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

export interface EventQuoteWhatsAppLinkResult {
  error?: string;
  url?: string;
}

export async function getEventQuoteWhatsAppLinkAction(eventId: string): Promise<EventQuoteWhatsAppLinkResult> {
  const { companyId } = await requireCompanyStaff();

  try {
    const url = await getEventQuoteWhatsAppLink(companyId, eventId);
    return { url };
  } catch (error) {
    if (error instanceof QuoteError) return { error: error.message };
    throw error;
  }
}

export interface WorkOrderWhatsAppLinkResult {
  error?: string;
  url?: string;
}

export async function getWorkOrderWhatsAppLinkAction(eventId: string): Promise<WorkOrderWhatsAppLinkResult> {
  const { companyId } = await requireCompanyStaff();

  try {
    const url = await getWorkOrderWhatsAppLink(companyId, eventId);
    return { url };
  } catch (error) {
    if (error instanceof WorkOrderError) return { error: error.message };
    throw error;
  }
}

