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

/**
 * Eventos confirmados en un rango de fechas para la pantalla de "Pagos de
 * clientes" — con la factura (si ya existe) para saber si falta poner el
 * monto o ya se puede marcar como cancelado por el cliente.
 */
export function listEventsForInvoicing(companyId: string, periodStart: Date, periodEnd: Date) {
  return prisma.event.findMany({
    where: {
      companyId,
      status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] },
      startAt: { gte: periodStart, lte: periodEnd },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      client: { select: { id: true, businessName: true } },
      invoices: {
        select: { id: true, amount: true, status: true, paidAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { startAt: "desc" },
  });
}

/** Ingresos (facturas pagadas) y por cobrar (emitidas, sin pagar) en el rango. */
export async function getClientPaymentStats(companyId: string, periodStart: Date, periodEnd: Date) {
  const baseWhere = {
    companyId,
    event: { startAt: { gte: periodStart, lte: periodEnd } },
  };

  const [issued, paid] = await Promise.all([
    prisma.clientInvoice.aggregate({
      where: { ...baseWhere, status: "ISSUED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.clientInvoice.aggregate({
      where: { ...baseWhere, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    pendingTotal: Number(issued._sum.amount ?? 0),
    pendingCount: issued._count,
    incomeTotal: Number(paid._sum.amount ?? 0),
    incomeCount: paid._count,
  };
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

export async function updateInvoiceAmount(companyId: string, id: string, amount: number) {
  const result = await prisma.clientInvoice.updateMany({
    where: { id, companyId, status: { not: "PAID" } },
    data: { amount },
  });
  if (result.count === 0) return null;
  return prisma.clientInvoice.findUniqueOrThrow({ where: { id } });
}
