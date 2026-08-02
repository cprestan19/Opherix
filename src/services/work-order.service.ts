/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { getEventDetail } from "@/repositories/event.repository";
import { getCompany } from "@/repositories/config.repository";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { getEventForAccessToken } from "@/services/event.service";
import { buildWorkOrderPdf } from "@/lib/work-order-pdf";

export class WorkOrderError extends Error {}

/**
 * Orden de trabajo (§ /admin/eventos/[eventId] "Orden de trabajo") — penúltimo
 * paso del flujo manual del Administrador antes de "Marcar completado" (el
 * paso IN_PROGRESS ocurre solo, disparado por el check-in del personal). Solo
 * lee datos ya existentes, no cambia el estado del evento ni genera ningún
 * registro — es un documento operativo descargable bajo demanda.
 */
async function buildWorkOrderBuffer(companyId: string, eventId: string) {
  const [event, company] = await Promise.all([getEventDetail(companyId, eventId), getCompany(companyId)]);
  if (!event) throw new WorkOrderError("Evento no encontrado.");

  const activeAssignments = event.assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED");
  if (activeAssignments.length === 0) {
    throw new WorkOrderError("Este evento todavía no tiene personal asignado.");
  }

  const buffer = await buildWorkOrderPdf({
    company: { name: company.name, logoUrl: company.logoUrl },
    event: {
      title: event.title,
      eventType: event.eventType,
      address: event.address,
      startAt: event.startAt,
      endAt: event.endAt,
      notes: event.notes,
    },
    contact: { name: event.client.contactName, phone: event.client.contactPhone },
    assignments: activeAssignments.map((a) => ({
      specialty: a.specialty,
      workerName: a.worker.user.name,
      workerPhone: a.worker.user.phone,
    })),
  });

  const filename = `orden-trabajo-${event.id.slice(-8)}.pdf`;
  return { buffer, filename, event };
}

/** Descarga autenticada desde el admin (§ /api/eventos/[eventId]/orden-trabajo). */
export async function getWorkOrderPdf(companyId: string, eventId: string) {
  const { buffer, filename } = await buildWorkOrderBuffer(companyId, eventId);
  return { buffer, filename };
}

/**
 * Descarga pública de la orden de trabajo (§ /admin/eventos/[eventId]
 * "Enviar por WhatsApp") — reusa el mismo accessToken propio del evento que
 * ya protege /evento/[eventId], /evento/[eventId]/factura y
 * /evento/[eventId]/cotizacion, para que el Cliente pueda abrirla sin sesión
 * desde el link que le llega por WhatsApp.
 */
export async function getWorkOrderPdfForPublicAccess(companySlug: string, eventId: string, token: string) {
  const company = await findCompanyBySlug(companySlug);
  if (!company) throw new WorkOrderError("Enlace no válido.");

  const { event, denied } = await getEventForAccessToken(company.id, eventId, token);
  if (!event || denied) throw new WorkOrderError("Este enlace ya no está disponible.");

  const { buffer, filename } = await buildWorkOrderBuffer(company.id, eventId);
  return { buffer, filename };
}

/**
 * Link de WhatsApp con la orden de trabajo (§ /admin/eventos/[eventId]
 * "Enviar por WhatsApp") — a diferencia de la cotización (dirigida siempre
 * al mismo Cliente), este link NO fija un número: abre WhatsApp con el
 * mensaje y el link ya armados, y el Administrador elige el contacto
 * (cliente, supervisor, grupo del personal, etc.) desde su propio WhatsApp.
 */
export async function getWorkOrderWhatsAppLink(companyId: string, eventId: string) {
  const company = await getCompany(companyId);
  const { event } = await buildWorkOrderBuffer(companyId, eventId);

  if (!event.accessToken || event.accessClosedAt) {
    throw new WorkOrderError("El enlace del evento no está activo — reactívalo desde la pantalla del evento.");
  }
  if (event.accessTokenExpiresAt && event.accessTokenExpiresAt < new Date()) {
    throw new WorkOrderError("El enlace del evento venció — reactívalo desde la pantalla del evento.");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const workOrderUrl = `${baseUrl}/solicitar/${company.slug}/evento/${event.id}/orden-trabajo?token=${event.accessToken}`;
  const message = `Orden de trabajo — ${event.title}\n\n${workOrderUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
