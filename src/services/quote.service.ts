/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as eventRepo from "@/repositories/event.repository";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { findClientByAccessToken } from "@/repositories/client.repository";
import { getEventForAccessToken } from "@/services/event.service";
import { getClientSpecialtyRates } from "@/services/client-specialty-rate.service";
import { getCompany } from "@/repositories/config.repository";
import { estimateClientCharge } from "@/lib/pricing/estimate-client-charge";
import { buildQuotePdf, type QuotePdfEvent } from "@/lib/quote-pdf";
import type { Specialty } from "@/generated/prisma/enums";

export class QuoteError extends Error {}

interface QuoteClient {
  businessName: string;
  taxId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
}

interface QuoteCompany {
  name: string;
  slug: string;
  taxId: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
}

interface QuoteEventInput {
  id: string;
  title: string;
  address: string;
  startAt: Date;
  clientId: string;
  staffRequirements: { specialty: Specialty; quantity: number }[];
}

async function buildQuoteBuffer(
  companyId: string,
  company: QuoteCompany,
  client: QuoteClient,
  events: QuoteEventInput[],
) {
  if (events.length === 0) throw new QuoteError("No se encontraron los eventos de esta cotización.");

  const rawRates = await getClientSpecialtyRates(companyId, events[0].clientId);
  const rates = rawRates.map((rate) => ({ specialty: rate.specialty, chargeToClient: Number(rate.chargeToClient) }));

  const quoteEvents: QuotePdfEvent[] = events.map((event) => ({
    title: event.title,
    address: event.address,
    startAt: event.startAt,
    estimate: estimateClientCharge(rates, event.staffRequirements),
  }));
  const grandTotal = quoteEvents.reduce((sum, e) => sum + e.estimate.total, 0);
  const anyMissingRate = quoteEvents.some((e) => e.estimate.missingSpecialties.length > 0);

  const buffer = await buildQuotePdf({
    company: { name: company.name, taxId: company.taxId, phone: company.phone, address: company.address, logoUrl: company.logoUrl },
    client,
    generatedAt: new Date(),
    events: quoteEvents,
    grandTotal,
    anyMissingRate,
  });

  const filename = `cotizacion-${company.slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  return { buffer, filename };
}

/**
 * Descarga pública de la cotización justo después de que el Cliente confirma
 * el envío de su lote de eventos (§ /solicitar/[companySlug]/cliente/[token],
 * pantalla de éxito) — protegida por el mismo accessToken permanente del
 * cliente, sin cuenta ni sesión. `eventIds` viene de los eventos que ese
 * mismo envío acaba de crear (nunca se confía en IDs arbitrarios: el
 * repositorio filtra por companyId + clientId además del listado).
 */
export async function getBatchQuotePdfForClient(companySlug: string, token: string, eventIds: string[]) {
  if (eventIds.length === 0) throw new QuoteError("No hay eventos para cotizar.");

  const company = await findCompanyBySlug(companySlug);
  if (!company) throw new QuoteError("Enlace no válido.");

  const client = await findClientByAccessToken(company.id, token);
  if (!client) throw new QuoteError("Enlace no válido.");

  const events = await eventRepo.listEventsForClientQuote(company.id, client.id, eventIds);

  return buildQuoteBuffer(
    company.id,
    { name: company.name, slug: company.slug, taxId: company.taxId, phone: company.phone, address: company.address, logoUrl: company.logoUrl },
    {
      businessName: client.businessName,
      taxId: client.taxId,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
    },
    events,
  );
}

/**
 * Descarga pública de la cotización de UN evento ya creado (§ /admin/eventos/
 * [eventId] "Reenviar cotización" por WhatsApp, y /solicitar/[companySlug]/
 * evento/[eventId]/cotizacion) — reusa el mismo accessToken propio del
 * evento que ya protege /evento/[eventId] y /evento/[eventId]/factura, en
 * vez del accessToken permanente del cliente (que además permite crear
 * eventos nuevos): el link de WhatsApp solo debe alcanzar para ver ESTA
 * cotización, nada más.
 */
export async function getEventQuotePdfForPublicAccess(companySlug: string, eventId: string, token: string) {
  const company = await findCompanyBySlug(companySlug);
  if (!company) throw new QuoteError("Enlace no válido.");

  const { event, denied } = await getEventForAccessToken(company.id, eventId, token);
  if (!event || denied) throw new QuoteError("Este enlace ya no está disponible.");

  const events = await eventRepo.listEventsForQuote(company.id, [eventId]);
  if (events.length === 0) throw new QuoteError("Evento no encontrado.");

  return buildQuoteBuffer(
    company.id,
    { name: company.name, slug: company.slug, taxId: company.taxId, phone: company.phone, address: company.address, logoUrl: company.logoUrl },
    events[0].client,
    events,
  );
}

/**
 * Link de WhatsApp con la cotización (§ /admin/eventos/[eventId] "Reenviar
 * cotización") — igual que `getInvoiceWhatsAppLink` en invoice.service.ts:
 * wa.me no permite adjuntar archivos, así que se manda un link directo a la
 * descarga pública en vez del PDF.
 */
export async function getEventQuoteWhatsAppLink(companyId: string, eventId: string) {
  const company = await getCompany(companyId);
  const events = await eventRepo.listEventsForQuote(companyId, [eventId]);
  if (events.length === 0) throw new QuoteError("Evento no encontrado.");
  const [event] = events;

  if (!event.client.contactPhone) {
    throw new QuoteError("Este cliente no tiene teléfono registrado.");
  }
  if (!event.accessToken || event.accessClosedAt) {
    throw new QuoteError("El enlace del evento no está activo — reactívalo desde la pantalla del evento.");
  }
  if (event.accessTokenExpiresAt && event.accessTokenExpiresAt < new Date()) {
    throw new QuoteError("El enlace del evento venció — reactívalo desde la pantalla del evento.");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const quoteUrl = `${baseUrl}/solicitar/${company.slug}/evento/${event.id}/cotizacion?token=${event.accessToken}`;

  const message = `Hola ${event.client.contactName}, aquí tu cotización de "${event.title}".\n\n${quoteUrl}`;

  const digits = event.client.contactPhone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
