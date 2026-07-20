/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
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
    include: { _count: { select: { events: true } } },
    orderBy: { businessName: "asc" },
  });
}

export function createClientWithUser(data: {
  companyId: string;
  businessName: string;
  taxId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  passwordHash: string;
}) {
  const { companyId, businessName, taxId, contactName, contactEmail, contactPhone, address, passwordHash } = data;

  return prisma.client.create({
    data: {
      companyId,
      businessName,
      taxId,
      contactName,
      contactEmail,
      contactPhone,
      address,
      users: {
        create: {
          companyId,
          email: contactEmail.toLowerCase(),
          passwordHash,
          name: contactName,
          phone: contactPhone,
          role: "CLIENT",
          status: "ACTIVE",
        },
      },
    },
    include: { users: true },
  });
}
