/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function createInvoice(data: {
  companyId: string;
  clientId: string;
  eventId: string;
  periodStart: Date;
  periodEnd: Date;
  amount: number;
}) {
  return prisma.clientInvoice.create({
    data: { ...data, status: "ISSUED", issuedAt: new Date() },
  });
}

export function findInvoiceForEvent(eventId: string) {
  return prisma.clientInvoice.findFirst({ where: { eventId } });
}

export function listInvoicesForClient(companyId: string, clientId: string) {
  return prisma.clientInvoice.findMany({
    where: { companyId, clientId },
    include: { event: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function markInvoicePaid(companyId: string, id: string) {
  const result = await prisma.clientInvoice.updateMany({
    where: { id, companyId },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (result.count === 0) return null;
  return prisma.clientInvoice.findUniqueOrThrow({ where: { id } });
}
