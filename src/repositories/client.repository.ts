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
    where: { companyId },
    include: {
      _count: { select: { events: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { businessName: "asc" },
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
}) {
  return prisma.client.create({ data });
}

export function findClientByEmail(companyId: string, contactEmail: string) {
  return prisma.client.findFirst({
    where: { companyId, contactEmail: { equals: contactEmail, mode: "insensitive" } },
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
      OR: [
        { contactEmail: { equals: contactEmail, mode: "insensitive" } },
        ...(contactPhone ? [{ contactPhone: { equals: contactPhone, mode: "insensitive" as const } }] : []),
      ],
    },
  });
}
