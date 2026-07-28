/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export interface FinancialReportFilters {
  periodStart?: Date;
  periodEnd?: Date;
  clientId?: string;
  eventId?: string;
  workerId?: string;
}

const INVOICEABLE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;

/**
 * Reporte financiero (§ Reportes > Financiero) — grano por evento, usando
 * datos REALMENTE registrados (ClientInvoice/PaymentRecord), no una
 * recalculación teórica desde las tarifas actuales: un analista financiero
 * necesita lo que de verdad se facturó/pagó, que puede diferir de la
 * tarifa vigente hoy (ediciones manuales, tarifas cambiadas después). El
 * filtro de empleado narrows por participación (WorkerAssignment), no
 * cambia el grano — sigue siendo un renglón por evento.
 */
export function listFinancialReportEvents(companyId: string, filters: FinancialReportFilters) {
  return prisma.event.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { in: [...INVOICEABLE_STATUSES] },
      ...(filters.periodStart && filters.periodEnd
        ? { startAt: { gte: filters.periodStart, lte: filters.periodEnd } }
        : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.eventId ? { id: filters.eventId } : {}),
      ...(filters.workerId
        ? { assignments: { some: { workerId: filters.workerId, status: { notIn: ["CANCELLED", "REJECTED"] } } } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      status: true,
      client: { select: { id: true, businessName: true } },
      invoices: { select: { amount: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      paymentRecords: { select: { totalAmount: true } },
      assignments: { where: { status: { notIn: ["CANCELLED", "REJECTED"] } }, select: { id: true } },
    },
    orderBy: { startAt: "desc" },
  });
}

/** Para el selector "Evento" del filtro — opcionalmente acotado a un cliente ya elegido. */
export function listEventsForFilter(companyId: string, clientId?: string) {
  return prisma.event.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { in: [...INVOICEABLE_STATUSES] },
      ...(clientId ? { clientId } : {}),
    },
    select: { id: true, title: true, startAt: true },
    orderBy: { startAt: "desc" },
    take: 300,
  });
}
