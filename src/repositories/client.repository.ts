/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

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
  return prisma.client.create({ data });
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
