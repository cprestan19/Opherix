/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as paymentRepo from "@/repositories/payment.repository";
import { computeHoursBreakdown, computeTotalAmount } from "@/lib/pay-calculation";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

export class PaymentError extends Error {}

const DEFAULT_RULES = { overtimeMultiplier: 1.5, sundayMultiplier: 1.5, holidayMultiplier: 2.0 };

export async function calculatePaymentsForPeriod(
  companyId: string,
  companyCountry: string,
  actorId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const [ruleSet, holidays, workers] = await Promise.all([
    paymentRepo.getActivePayRuleSet(companyId, companyCountry),
    paymentRepo.listHolidays(companyId, companyCountry),
    paymentRepo.listActiveWorkersWithRate(companyId),
  ]);

  const rules = ruleSet
    ? {
        overtimeMultiplier: Number(ruleSet.overtimeMultiplier),
        sundayMultiplier: Number(ruleSet.sundayMultiplier),
        holidayMultiplier: Number(ruleSet.holidayMultiplier),
      }
    : DEFAULT_RULES;
  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  let created = 0;
  for (const worker of workers) {
    if (!worker.hourlyRate) continue;

    const existing = await paymentRepo.findExistingRecord(worker.id, periodStart, periodEnd);
    if (existing) continue;

    const shifts = await paymentRepo.listCompletedShifts(worker.id, periodStart, periodEnd);
    if (shifts.length === 0) continue;

    const validShifts = shifts.filter(
      (s): s is { checkInAt: Date; checkOutAt: Date } => s.checkInAt !== null && s.checkOutAt !== null,
    );
    const breakdown = computeHoursBreakdown(validShifts, holidayDates);
    const totalAmount = computeTotalAmount(breakdown, Number(worker.hourlyRate), rules);

    await paymentRepo.createPaymentRecord({
      companyId,
      workerId: worker.id,
      periodStart,
      periodEnd,
      ...breakdown,
      totalAmount,
    });
    created += 1;
  }

  await logAudit({
    companyId,
    actorId,
    action: "PAYMENTS_CALCULATED",
    entityType: "PaymentRecord",
    entityId: `${periodStart.toISOString()}_${periodEnd.toISOString()}`,
    metadata: { created },
  });

  return { created };
}

export async function markPaymentAsPaid(
  companyId: string,
  actorId: string,
  paymentRecordId: string,
  paymentMethod: string,
) {
  const updated = await paymentRepo.markAsPaid(paymentRecordId, actorId, paymentMethod);
  await logAudit({
    companyId,
    actorId,
    action: "PAYMENT_MARKED_PAID",
    entityType: "PaymentRecord",
    entityId: paymentRecordId,
    metadata: { paymentMethod },
  });

  const worker = await prisma.worker.findUnique({ where: { id: updated.workerId }, select: { userId: true } });
  if (worker) {
    await dispatchNotification({
      companyId,
      userId: worker.userId,
      type: "PAYMENT_PAID",
      title: "Pago registrado",
      body: `Se registró tu pago por ${paymentMethod}. Consulta el detalle en tu portal.`,
      relatedEntityType: "PaymentRecord",
      relatedEntityId: paymentRecordId,
    });
  }

  return updated;
}

export async function adjustPayment(
  companyId: string,
  actorId: string,
  paymentRecordId: string,
  bonuses: number,
  deductions: number,
) {
  const records = await paymentRepo.listPaymentRecords(companyId);
  const record = records.find((r) => r.id === paymentRecordId);
  if (!record) throw new PaymentError("Registro de pago no encontrado.");
  if (record.status === "PAGADO") throw new PaymentError("No se puede editar un pago ya marcado como pagado.");

  const baseAmount =
    Number(record.totalAmount) - Number(record.bonuses) + Number(record.deductions);
  const totalAmount = Math.max(0, baseAmount + bonuses - deductions);

  const updated = await paymentRepo.updateBonusesAndDeductions(paymentRecordId, bonuses, deductions, totalAmount);
  await logAudit({
    companyId,
    actorId,
    action: "PAYMENT_ADJUSTED",
    entityType: "PaymentRecord",
    entityId: paymentRecordId,
    metadata: { bonuses, deductions },
  });
  return updated;
}
