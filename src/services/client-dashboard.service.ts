/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export async function getClientDashboardStats(companyId: string, clientId: string) {
  const now = new Date();

  const [upcomingEvents, activeRequests, invoicesPending, totalSpent] = await Promise.all([
    prisma.event.count({
      where: { companyId, clientId, startAt: { gte: now }, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.event.count({
      where: { companyId, clientId, status: { in: ["REQUESTED", "CONFIRMED"] } },
    }),
    prisma.clientInvoice.aggregate({
      where: { companyId, clientId, status: "ISSUED" },
      _sum: { amount: true },
    }),
    prisma.clientInvoice.aggregate({
      where: { companyId, clientId, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  return {
    upcomingEvents,
    activeRequests,
    invoicesPending: Number(invoicesPending._sum.amount ?? 0),
    totalSpent: Number(totalSpent._sum.amount ?? 0),
  };
}

export async function getRecentEventsForClient(companyId: string, clientId: string, take = 5) {
  return prisma.event.findMany({
    where: { companyId, clientId },
    orderBy: { startAt: "desc" },
    take,
  });
}
