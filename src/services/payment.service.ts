/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as paymentRepo from "@/repositories/payment.repository";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

export class PaymentError extends Error {}

/**
 * Suma, por trabajador, las tarifas fijas por especialidad (§ ClientSpecialtyRate.payToWorker)
 * de cada asignación ACCEPTED con check-in/out dentro del periodo — reemplaza el cálculo
 * anterior por hora trabajada (Worker.hourlyRate, ya eliminado).
 */
export async function calculatePaymentsForPeriod(
  companyId: string,
  actorId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const [assignments, rates] = await Promise.all([
    paymentRepo.listAcceptedAssignmentsForPeriod(companyId, periodStart, periodEnd),
    paymentRepo.listClientSpecialtyRates(companyId),
  ]);

  const rateByClientSpecialty = new Map(
    rates.map((rate) => [`${rate.clientId}:${rate.specialty}`, Number(rate.payToWorker)]),
  );

  const totalsByWorker = new Map<string, { totalAmount: number; assignmentCount: number }>();
  for (const assignment of assignments) {
    if (!assignment.specialty) continue;
    const rate = rateByClientSpecialty.get(`${assignment.event.clientId}:${assignment.specialty}`);
    if (rate === undefined) continue;

    const entry = totalsByWorker.get(assignment.workerId) ?? { totalAmount: 0, assignmentCount: 0 };
    entry.totalAmount += rate;
    entry.assignmentCount += 1;
    totalsByWorker.set(assignment.workerId, entry);
  }

  let created = 0;
  for (const [workerId, { totalAmount, assignmentCount }] of totalsByWorker) {
    const existing = await paymentRepo.findExistingRecord(workerId, periodStart, periodEnd);
    if (existing) continue;

    await paymentRepo.createPaymentRecord({
      companyId,
      workerId,
      periodStart,
      periodEnd,
      assignmentCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
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
  const updated = await paymentRepo.markAsPaid(companyId, paymentRecordId, actorId, paymentMethod);
  if (!updated) throw new PaymentError("Registro de pago no encontrado.");
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

  const updated = await paymentRepo.updateBonusesAndDeductions(
    companyId,
    paymentRecordId,
    bonuses,
    deductions,
    totalAmount,
  );
  if (!updated) throw new PaymentError("Registro de pago no encontrado.");
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
