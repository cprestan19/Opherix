/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as invoiceRepo from "@/repositories/invoice.repository";
import { getCompany } from "@/repositories/config.repository";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { getEventForAccessToken } from "@/services/event.service";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { sendEmail } from "@/lib/notifications/email";
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

/**
 * Poner/editar el monto del evento desde "Pagos de clientes" — a diferencia
 * de issueInvoiceForEvent (que falla si ya existe una factura), esta
 * actualiza el monto si ya hay una emitida (mientras no esté pagada), o
 * crea una nueva si el evento todavía no tiene ninguna.
 */
export async function setEventInvoiceAmount(
  companyId: string,
  actorId: string,
  eventId: string,
  clientId: string,
  eventStartAt: Date,
  eventEndAt: Date,
  amount: number,
) {
  if (amount <= 0) throw new InvoiceError("El monto debe ser mayor a cero.");

  const existing = await invoiceRepo.findInvoiceForEvent(eventId);
  if (!existing) {
    return issueInvoiceForEvent(companyId, actorId, eventId, clientId, eventStartAt, eventEndAt, amount);
  }
  if (existing.status === "PAID") {
    throw new InvoiceError("Este cobro ya está marcado como cancelado, no se puede editar el monto.");
  }

  const updated = await invoiceRepo.updateInvoiceAmount(companyId, existing.id, amount);
  if (!updated) throw new InvoiceError("Factura no encontrada.");

  await logAudit({
    companyId,
    actorId,
    action: "INVOICE_AMOUNT_UPDATED",
    entityType: "ClientInvoice",
    entityId: existing.id,
    metadata: { amount },
  });

  return updated;
}

async function loadInvoicePdf(companyId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findInvoiceWithDetails(companyId, invoiceId);
  if (!invoice) throw new InvoiceError("Factura no encontrada.");
  if (!invoice.event) throw new InvoiceError("Este comprobante no está asociado a un evento.");

  const company = await getCompany(companyId);

  const buffer = buildInvoicePdf({
    company: { name: company.name, taxId: company.taxId, phone: company.phone, address: company.address },
    client: invoice.client,
    event: invoice.event,
    invoice: { id: invoice.id, amount: Number(invoice.amount), issuedAt: invoice.issuedAt, status: invoice.status },
  });

  const filename = `comprobante-${invoice.id.slice(-8)}.pdf`;
  return { buffer, filename, invoice };
}

export async function getInvoicePdfBuffer(companyId: string, invoiceId: string) {
  return loadInvoicePdf(companyId, invoiceId);
}

export async function sendInvoiceByEmail(companyId: string, actorId: string, invoiceId: string) {
  const { buffer, filename, invoice } = await loadInvoicePdf(companyId, invoiceId);

  const sent = await sendEmail(
    invoice.client.contactEmail,
    `Comprobante de cobro — ${invoice.event!.title}`,
    `Hola ${invoice.client.contactName},\n\nAdjuntamos el comprobante de cobro correspondiente a "${invoice.event!.title}".\n\nMonto a cancelar: ${new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(invoice.amount))}`,
    companyId,
    [{ filename, content: buffer }],
  );

  if (!sent) throw new InvoiceError("No se pudo enviar el correo — revisa la configuración SMTP.");

  await logAudit({
    companyId,
    actorId,
    action: "INVOICE_SENT_EMAIL",
    entityType: "ClientInvoice",
    entityId: invoiceId,
    metadata: { to: invoice.client.contactEmail },
  });

  return true;
}

/**
 * Link de WhatsApp con la factura (§ Pagos > Clientes "Enviar por
 * WhatsApp") — wa.me no permite adjuntar archivos, así que en vez de
 * intentar mandar el PDF se manda un link directo al comprobante público,
 * reusando el MISMO accessToken del evento (§ /solicitar/[companySlug]/
 * evento/[eventId], sin cuenta ni login) en vez de inventar un sistema de
 * tokens nuevo. Si el link del evento no está vigente, se le pide al
 * Administrador regenerarlo primero desde la pantalla del evento — no lo
 * regeneramos en silencio aquí para no confundir con el link que el cliente
 * ya pueda tener guardado para ver/editar su solicitud.
 */
export async function getInvoiceWhatsAppLink(companyId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findInvoiceWithDetails(companyId, invoiceId);
  if (!invoice) throw new InvoiceError("Factura no encontrada.");
  if (!invoice.event) throw new InvoiceError("Este comprobante no está asociado a un evento.");
  if (invoice.event.deletedAt) {
    throw new InvoiceError("El evento de este comprobante fue eliminado — el enlace ya no funcionaría.");
  }
  if (!invoice.client.contactPhone) {
    throw new InvoiceError("Este cliente no tiene teléfono registrado.");
  }
  if (!invoice.event.accessToken || invoice.event.accessClosedAt) {
    throw new InvoiceError("El enlace del evento no está activo — reactívalo desde la pantalla del evento.");
  }
  if (invoice.event.accessTokenExpiresAt && invoice.event.accessTokenExpiresAt < new Date()) {
    throw new InvoiceError("El enlace del evento venció — reactívalo desde la pantalla del evento.");
  }

  const company = await getCompany(companyId);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const invoiceUrl = `${baseUrl}/solicitar/${company.slug}/evento/${invoice.event.id}/factura?token=${invoice.event.accessToken}`;

  const message =
    `Hola ${invoice.client.contactName}, aquí tu comprobante de cobro de "${invoice.event.title}".\n\n` +
    `Monto a cancelar: ${new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(invoice.amount))}\n\n` +
    `${invoiceUrl}`;

  const digits = invoice.client.contactPhone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Descarga pública del comprobante (§ /solicitar/[companySlug]/evento/
 * [eventId]/factura) — sin cuenta ni sesión, valida el mismo accessToken
 * del evento que ya protege esa ruta, no expone nada nuevo.
 */
export async function getInvoicePdfForPublicAccess(companySlug: string, eventId: string, token: string) {
  const company = await findCompanyBySlug(companySlug);
  if (!company) throw new InvoiceError("Enlace no válido.");

  const { event, denied } = await getEventForAccessToken(company.id, eventId, token);
  if (!event || denied) throw new InvoiceError("Este enlace ya no está disponible.");

  const invoice = await invoiceRepo.findInvoiceForEvent(eventId);
  if (!invoice) throw new InvoiceError("Todavía no hay un comprobante para este evento.");

  return loadInvoicePdf(company.id, invoice.id);
}
