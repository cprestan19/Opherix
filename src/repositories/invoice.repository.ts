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

/** Con cliente y evento — para armar el PDF del comprobante (§ Pagos > Clientes "Generar factura"). */
export function findInvoiceWithDetails(companyId: string, invoiceId: string) {
  return prisma.clientInvoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      client: {
        select: {
          businessName: true,
          taxId: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          address: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          startAt: true,
          accessToken: true,
          accessTokenExpiresAt: true,
          accessClosedAt: true,
        },
      },
    },
  });
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
      deletedAt: null,
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

/** Total pendiente de cobro por cliente en el rango — para el resumen "Total por cliente" en Pagos > Clientes. */
export async function getPendingTotalsByClient(companyId: string, periodStart: Date, periodEnd: Date) {
  const rows = await prisma.clientInvoice.groupBy({
    by: ["clientId"],
    where: { companyId, status: "ISSUED", event: { startAt: { gte: periodStart, lte: periodEnd } } },
    _sum: { amount: true },
    _count: true,
  });
  if (rows.length === 0) return [];

  const clients = await prisma.client.findMany({
    where: { id: { in: rows.map((r) => r.clientId) } },
    select: { id: true, businessName: true },
  });
  const nameById = new Map(clients.map((c) => [c.id, c.businessName]));

  return rows
    .map((r) => ({
      clientId: r.clientId,
      clientName: nameById.get(r.clientId) ?? "Cliente",
      total: Number(r._sum.amount ?? 0),
      count: r._count,
    }))
    .sort((a, b) => b.total - a.total);
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
