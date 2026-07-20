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
import { prisma } from "@/lib/prisma";
import {
  calculatePaymentsForPeriod,
  markPaymentAsPaid,
  adjustPayment,
  PaymentError,
} from "@/services/payment.service";

export interface PaymentActionResult {
  error?: string;
}

export async function calculatePaymentsAction(
  periodStart: string,
  periodEnd: string,
): Promise<PaymentActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

  await calculatePaymentsForPeriod(
    companyId,
    company.country,
    user.id,
    new Date(periodStart),
    new Date(periodEnd),
  );

  revalidatePath("/admin/pagos");
  return {};
}

export async function markAsPaidAction(
  paymentRecordId: string,
  paymentMethod: string,
): Promise<PaymentActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await markPaymentAsPaid(companyId, user.id, paymentRecordId, paymentMethod);
  revalidatePath("/admin/pagos");
  return {};
}

export async function adjustPaymentAction(
  paymentRecordId: string,
  bonuses: number,
  deductions: number,
): Promise<PaymentActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  try {
    await adjustPayment(companyId, user.id, paymentRecordId, bonuses, deductions);
  } catch (error) {
    if (error instanceof PaymentError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/pagos");
  return {};
}
