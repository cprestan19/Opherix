/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Hourglass, CheckCircle2, TrendingUp } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listPaymentRecords, getPaymentStats } from "@/repositories/payment.repository";
import { listWorkers } from "@/repositories/worker.repository";
import {
  listEventsForInvoicing,
  getClientPaymentStats,
  getPendingTotalsByClient,
} from "@/repositories/invoice.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { cn } from "@/lib/utils";
import { PeriodForm } from "./period-form";
import { PaymentTable } from "./payment-table";
import { ClientPaymentsTable } from "./client-payments-table";
import { InvoicePeriodForm } from "./invoice-period-form";

function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default async function PagosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodStart?: string;
    periodEnd?: string;
    workerId?: string;
    view?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser.role === "VIEWER") redirect("/admin");

  const companyId = await getEffectiveCompanyId();
  const params = await searchParams;
  const periodStart = params.periodStart ?? startOfMonthIso();
  const periodEnd = params.periodEnd ?? endOfMonthIso();
  const workerId = params.workerId || undefined;
  const view = params.view === "clientes" ? "clientes" : "personal";

  const tabQuery = `periodStart=${periodStart}&periodEnd=${periodEnd}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Registro contable — no procesa transacciones reales.
        </p>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1 text-sm">
        <Link
          href={`/admin/pagos?${tabQuery}`}
          className={cn(
            "rounded-md px-3 py-1 transition-colors",
            view === "personal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Personal
        </Link>
        <Link
          href={`/admin/pagos?${tabQuery}&view=clientes`}
          className={cn(
            "rounded-md px-3 py-1 transition-colors",
            view === "clientes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Clientes
        </Link>
      </div>

      {view === "personal" ? (
        <PersonalPayments
          companyId={companyId}
          periodStart={periodStart}
          periodEnd={periodEnd}
          workerId={workerId}
        />
      ) : (
        <ClientPayments companyId={companyId} periodStart={periodStart} periodEnd={periodEnd} />
      )}
    </div>
  );
}

async function PersonalPayments({
  companyId,
  periodStart,
  periodEnd,
  workerId,
}: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  workerId?: string;
}) {
  const [records, stats, workers] = await Promise.all([
    listPaymentRecords(companyId, new Date(periodStart), new Date(periodEnd), workerId),
    getPaymentStats(companyId, new Date(periodStart), new Date(periodEnd), workerId),
    listWorkers(companyId),
  ]);

  const rows = records.map((r) => ({
    id: r.id,
    worker: { user: { name: r.worker.user.name } },
    eventTitle: r.event?.title ?? null,
    assignmentCount: r.assignmentCount,
    bonuses: r.bonuses.toString(),
    deductions: r.deductions.toString(),
    totalAmount: r.totalAmount.toString(),
    status: r.status,
  }));

  const workerOptions = workers.map((w) => ({ id: w.id, name: w.user.name }));

  return (
    <div className="flex flex-col gap-6">
      <PeriodForm
        periodStart={periodStart}
        periodEnd={periodEnd}
        workerId={workerId ?? ""}
        workers={workerOptions}
      />

      <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Pendiente por pagar"
            value={stats.pendingTotal}
            format="currency"
            icon={Hourglass}
            accent="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pagado en el periodo"
            value={stats.paidTotal}
            format="currency"
            icon={CheckCircle2}
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pagos generados"
            value={stats.pendingCount + stats.paidCount}
            icon={Wallet}
            accent="primary"
          />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardContent className="p-0">
          <PaymentTable records={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

async function ClientPayments({
  companyId,
  periodStart,
  periodEnd,
}: {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const [events, stats, pendingByClient] = await Promise.all([
    listEventsForInvoicing(companyId, new Date(periodStart), new Date(periodEnd)),
    getClientPaymentStats(companyId, new Date(periodStart), new Date(periodEnd)),
    getPendingTotalsByClient(companyId, new Date(periodStart), new Date(periodEnd)),
  ]);

  const rows = events.map((event) => {
    const invoice = event.invoices[0];
    return {
      eventId: event.id,
      eventTitle: event.title,
      clientId: event.client.id,
      clientName: event.client.businessName,
      startAt: event.startAt,
      invoice: invoice
        ? {
            id: invoice.id,
            amount: invoice.amount.toString(),
            status: invoice.status as "ISSUED" | "PAID",
            paidAt: invoice.paidAt,
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <InvoicePeriodForm periodStart={periodStart} periodEnd={periodEnd} />

      <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Pendiente de cobro"
            value={stats.pendingTotal}
            format="currency"
            icon={Hourglass}
            accent="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Ingresos del periodo" value={stats.incomeTotal} format="currency" icon={TrendingUp} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Cobros generados"
            value={stats.pendingCount + stats.incomeCount}
            icon={Wallet}
            accent="primary"
          />
        </StaggerItem>
      </StaggerContainer>

      {pendingByClient.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Total pendiente por cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {pendingByClient.map((row) => (
                <li key={row.clientId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span>
                    {row.clientName}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({row.count} factura{row.count === 1 ? "" : "s"})
                    </span>
                  </span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(row.total)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <ClientPaymentsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
