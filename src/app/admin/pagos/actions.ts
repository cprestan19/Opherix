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
  calculatePaymentsForPeriod,
  markPaymentAsPaid,
  adjustPayment,
  PaymentError,
} from "@/services/payment.service";
import { setEventInvoiceAmount, markInvoicePaid, InvoiceError } from "@/services/invoice.service";
import { getEventDetail } from "@/repositories/event.repository";

export interface PaymentActionResult {
  error?: string;
}

export async function calculatePaymentsAction(
  periodStart: string,
  periodEnd: string,
): Promise<PaymentActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  await calculatePaymentsForPeriod(companyId, user.id, new Date(periodStart), new Date(periodEnd));

  revalidatePath("/admin/pagos");
  return {};
}

export async function markAsPaidAction(
  paymentRecordId: string,
  paymentMethod: string,
): Promise<PaymentActionResult> {
  const { user, companyId } = await requireCompanyStaff();
  await markPaymentAsPaid(companyId, user.id, paymentRecordId, paymentMethod);
  revalidatePath("/admin/pagos");
  return {};
}

export async function adjustPaymentAction(
  paymentRecordId: string,
  bonuses: number,
  deductions: number,
): Promise<PaymentActionResult> {
  const { user, companyId } = await requireCompanyStaff();
  try {
    await adjustPayment(companyId, user.id, paymentRecordId, bonuses, deductions);
  } catch (error) {
    if (error instanceof PaymentError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/pagos");
  return {};
}

export async function setEventAmountAction(eventId: string, amount: number): Promise<PaymentActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  const event = await getEventDetail(companyId, eventId);
  if (!event) return { error: "Evento no encontrado." };

  try {
    await setEventInvoiceAmount(companyId, user.id, eventId, event.clientId, event.startAt, event.endAt, amount);
  } catch (error) {
    if (error instanceof InvoiceError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/pagos");
  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function markInvoicePaidAction(invoiceId: string, eventId?: string): Promise<PaymentActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await markInvoicePaid(companyId, user.id, invoiceId);
  } catch (error) {
    if (error instanceof InvoiceError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/pagos");
  if (eventId) revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}
