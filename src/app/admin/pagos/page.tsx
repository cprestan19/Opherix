/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listPaymentRecords } from "@/repositories/payment.repository";
import { Card, CardContent } from "@/components/ui/card";
import { PeriodForm } from "./period-form";
import { PaymentTable } from "./payment-table";

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
  searchParams: Promise<{ periodStart?: string; periodEnd?: string }>;
}) {
  const companyId = await getEffectiveCompanyId();
  const params = await searchParams;
  const periodStart = params.periodStart ?? startOfMonthIso();
  const periodEnd = params.periodEnd ?? endOfMonthIso();

  const records = await listPaymentRecords(companyId, new Date(periodStart), new Date(periodEnd));

  const rows = records.map((r) => ({
    id: r.id,
    worker: { user: { name: r.worker.user.name } },
    regularHours: r.regularHours.toString(),
    overtimeHours: r.overtimeHours.toString(),
    sundayHours: r.sundayHours.toString(),
    holidayHours: r.holidayHours.toString(),
    bonuses: r.bonuses.toString(),
    deductions: r.deductions.toString(),
    totalAmount: r.totalAmount.toString(),
    status: r.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Registro y cálculo de pagos a trabajadores — no procesa transacciones reales.
        </p>
      </div>

      <PeriodForm periodStart={periodStart} periodEnd={periodEnd} />

      <Card>
        <CardContent className="p-0">
          <PaymentTable records={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
