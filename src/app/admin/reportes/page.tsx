/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getFinancialReport, getFinancialReportFilterOptions } from "@/services/financial-report.service";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { cn } from "@/lib/utils";
import { FinancialReportFilters } from "./financial-report-filters";
import { FinancialReportTable } from "./financial-report-table";
import { OperationalDashboard } from "./operational-dashboard";

function startOfYearIso() {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    periodStart?: string;
    periodEnd?: string;
    clientId?: string;
    eventId?: string;
    workerId?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  // El reporte financiero (ingreso/egreso/margen por evento) es tan sensible
  // como Pagos — mismo gate: VIEWER solo ve la pestaña Operativa, nunca
  // números de facturación o pago al personal.
  const canSeeFinancial = currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";
  const view = params.view === "financiero" && canSeeFinancial ? "financiero" : params.view === "operativo" ? "operativo" : canSeeFinancial ? "financiero" : "operativo";

  const companyId = await getEffectiveCompanyId();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          {view === "financiero" ? "Ingresos, egresos y margen por evento." : "Horas, eventos, puntualidad y ranking de trabajadores."}
        </p>
      </div>

      {canSeeFinancial ? (
        <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1 text-sm">
          <Link
            href="/admin/reportes?view=financiero"
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              view === "financiero" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Financiero
          </Link>
          <Link
            href="/admin/reportes?view=operativo"
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              view === "operativo" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Operativo
          </Link>
        </div>
      ) : null}

      {view === "financiero" ? (
        <FinancialReport companyId={companyId} params={params} />
      ) : (
        <OperationalDashboard />
      )}
    </div>
  );
}

async function FinancialReport({
  companyId,
  params,
}: {
  companyId: string;
  params: {
    periodStart?: string;
    periodEnd?: string;
    clientId?: string;
    eventId?: string;
    workerId?: string;
  };
}) {
  const periodStart = params.periodStart ?? startOfYearIso();
  const periodEnd = params.periodEnd ?? todayIso();
  const clientId = params.clientId ?? "";
  const eventId = params.eventId ?? "";
  const workerId = params.workerId ?? "";

  const [report, filterOptions] = await Promise.all([
    getFinancialReport(companyId, {
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      clientId: clientId || undefined,
      eventId: eventId || undefined,
      workerId: workerId || undefined,
    }),
    getFinancialReportFilterOptions(companyId, clientId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <FinancialReportFilters
        periodStart={periodStart}
        periodEnd={periodEnd}
        clientId={clientId}
        eventId={eventId}
        workerId={workerId}
        clients={filterOptions.clients}
        events={filterOptions.events}
        workers={filterOptions.workers}
      />

      <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StaggerItem>
          <StatCard label="Ingreso total" value={report.totals.ingreso} format="currency" icon={TrendingUp} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Egreso total" value={report.totals.egreso} format="currency" icon={TrendingDown} accent="danger" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Margen total" value={report.totals.margen} format="currency" icon={Scale} accent="primary" />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardContent className="p-0">
          <FinancialReportTable rows={report.rows} />
        </CardContent>
      </Card>
    </div>
  );
}
