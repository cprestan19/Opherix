/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as financialReportRepo from "@/repositories/financial-report.repository";
import type { FinancialReportFilters } from "@/repositories/financial-report.repository";
import { listClients } from "@/repositories/client.repository";
import { listWorkers } from "@/repositories/worker.repository";

export interface FinancialReportRow {
  eventId: string;
  title: string;
  startAt: Date;
  status: string;
  clientId: string;
  clientName: string;
  staffCount: number;
  ingreso: number;
  egreso: number;
  margen: number;
  invoiceStatus: string | null;
}

export async function getFinancialReport(companyId: string, filters: FinancialReportFilters) {
  const events = await financialReportRepo.listFinancialReportEvents(companyId, filters);

  const rows: FinancialReportRow[] = events.map((e) => {
    const ingreso = e.invoices[0] ? Number(e.invoices[0].amount) : 0;
    const egreso = e.paymentRecords.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    return {
      eventId: e.id,
      title: e.title,
      startAt: e.startAt,
      status: e.status,
      clientId: e.client.id,
      clientName: e.client.businessName,
      staffCount: e.assignments.length,
      ingreso,
      egreso,
      margen: ingreso - egreso,
      invoiceStatus: e.invoices[0]?.status ?? null,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({ ingreso: acc.ingreso + r.ingreso, egreso: acc.egreso + r.egreso, margen: acc.margen + r.margen }),
    { ingreso: 0, egreso: 0, margen: 0 },
  );

  return { rows, totals };
}

export async function getFinancialReportFilterOptions(companyId: string, clientId?: string) {
  const [clients, workers, events] = await Promise.all([
    listClients(companyId),
    listWorkers(companyId),
    financialReportRepo.listEventsForFilter(companyId, clientId),
  ]);

  return {
    clients: clients.map((c) => ({ id: c.id, name: c.businessName })),
    workers: workers.map((w) => ({ id: w.id, name: w.user.name })),
    events: events.map((e) => ({ id: e.id, title: e.title, startAt: e.startAt })),
  };
}
