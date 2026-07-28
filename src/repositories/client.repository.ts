/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { generateClientPortalToken } from "@/lib/client-portal-link";

export function listClients(companyId: string) {
  return prisma.client.findMany({
    where: { companyId, deletedAt: null },
    include: {
      _count: { select: { events: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { businessName: "asc" },
  });
}

export function listDeletedClients(companyId: string) {
  return prisma.client.findMany({
    where: { companyId, deletedAt: { not: null } },
    include: { _count: { select: { events: true } } },
    orderBy: { deletedAt: "desc" },
  });
}

// El Cliente ya no tiene cuenta/contraseña (§ /solicitar/[companySlug],
// reemplazo del portal /cliente/* con login) — es solo un registro de
// contacto para facturación e historial de eventos.
export function createClient(data: {
  companyId: string;
  businessName: string;
  taxId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  operationRegistrationUrl?: string;
  operationRegistrationFileName?: string;
}) {
  return prisma.client.create({ data: { ...data, accessToken: generateClientPortalToken() } });
}

export async function setClientActive(companyId: string, clientId: string, isActive: boolean) {
  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId, deletedAt: null },
    data: { isActive },
  });
  if (result.count === 0) return null;
  return prisma.client.findUniqueOrThrow({ where: { id: clientId } });
}

export async function softDeleteClient(companyId: string, clientId: string, reason: string) {
  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedReason: reason, isActive: false },
  });
  if (result.count === 0) return null;
  return prisma.client.findUniqueOrThrow({ where: { id: clientId } });
}

export async function restoreClient(companyId: string, clientId: string) {
  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId, deletedAt: { not: null } },
    data: { deletedAt: null, deletedReason: null },
  });
  if (result.count === 0) return null;
  return prisma.client.findUniqueOrThrow({ where: { id: clientId } });
}

export function findClientById(companyId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
}

/** URL propia del cliente (§ /solicitar/[companySlug]/cliente/[token]) — nunca resuelve un cliente eliminado. */
export function findClientByAccessToken(companyId: string, accessToken: string) {
  return prisma.client.findFirst({ where: { companyId, accessToken, deletedAt: null } });
}

/** Genera el token perezosamente si el cliente aún no tenía uno (creado antes de este feature). */
export async function getOrCreateAccessToken(companyId: string, clientId: string): Promise<string | null> {
  const client = await prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
  if (!client) return null;
  if (client.accessToken) return client.accessToken;

  const accessToken = generateClientPortalToken();
  await prisma.client.update({ where: { id: clientId }, data: { accessToken } });
  return accessToken;
}

/** Reemplaza el token existente — invalida cualquier URL anterior que se haya compartido. */
export async function regenerateAccessToken(companyId: string, clientId: string): Promise<string | null> {
  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId, deletedAt: null },
    data: { accessToken: generateClientPortalToken() },
  });
  if (result.count === 0) return null;
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId }, select: { accessToken: true } });
  return client.accessToken;
}

export function findClientByEmail(companyId: string, contactEmail: string) {
  return prisma.client.findFirst({
    where: { companyId, contactEmail: { equals: contactEmail, mode: "insensitive" }, deletedAt: null },
  });
}

/**
 * Reconocimiento de cliente recurrente para CRM: si el correo O el teléfono
 * coincide con un cliente ya registrado en esta empresa, se agrupa bajo el
 * mismo Client en vez de crear un duplicado — así el historial de
 * solicitudes queda consolidado para análisis, aunque escriba desde otro
 * correo la próxima vez.
 */
/**
 * Historial de eventos del cliente (§ /admin/clientes/[clientId], pestaña
 * "Historial") — cantidad de personal es la de asignaciones ACTIVAS
 * (no canceladas/rechazadas), no lo originalmente solicitado, igual
 * criterio que el total del evento (§ computeEventChargeTotal). El monto
 * es la última factura emitida/pagada de ese evento, si existe.
 */
export function listEventsHistoryForClient(companyId: string, clientId: string) {
  return prisma.event.findMany({
    where: { companyId, clientId, deletedAt: null },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true,
      assignments: { where: { status: { notIn: ["CANCELLED", "REJECTED"] } }, select: { id: true } },
      invoices: { select: { amount: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { startAt: "desc" },
  });
}

export function findClientByEmailOrPhone(companyId: string, contactEmail: string, contactPhone?: string) {
  return prisma.client.findFirst({
    where: {
      companyId,
      deletedAt: null,
      OR: [
        { contactEmail: { equals: contactEmail, mode: "insensitive" } },
        ...(contactPhone ? [{ contactPhone: { equals: contactPhone, mode: "insensitive" as const } }] : []),
      ],
    },
  });
}
