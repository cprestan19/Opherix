/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as invoiceRepo from "@/repositories/invoice.repository";
import { logAudit } from "@/lib/audit";

export class InvoiceError extends Error {}

export async function issueInvoiceForEvent(
  companyId: string,
  actorId: string,
  eventId: string,
  clientId: string,
  eventStartAt: Date,
  eventEndAt: Date,
  amount: number,
) {
  const existing = await invoiceRepo.findInvoiceForEvent(eventId);
  if (existing) throw new InvoiceError("Este evento ya tiene una factura emitida.");
  if (amount <= 0) throw new InvoiceError("El monto debe ser mayor a cero.");

  const invoice = await invoiceRepo.createInvoice({
    companyId,
    clientId,
    eventId,
    periodStart: eventStartAt,
    periodEnd: eventEndAt,
    amount,
  });

  await logAudit({
    companyId,
    actorId,
    action: "INVOICE_ISSUED",
    entityType: "ClientInvoice",
    entityId: invoice.id,
    metadata: { amount },
  });

  return invoice;
}

export async function markInvoicePaid(companyId: string, actorId: string, invoiceId: string) {
  const updated = await invoiceRepo.markInvoicePaid(companyId, invoiceId);
  if (!updated) throw new InvoiceError("Factura no encontrada.");
  await logAudit({ companyId, actorId, action: "INVOICE_PAID", entityType: "ClientInvoice", entityId: invoiceId });
  return updated;
}
