/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Calculator, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePaymentsAction } from "./actions";

export function PeriodForm({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [isPending, startTransition] = useTransition();

  function applyPeriod() {
    router.push(`${pathname}?periodStart=${start}&periodEnd=${end}`);
  }

  function handleCalculate() {
    startTransition(async () => {
      await calculatePaymentsAction(start, end);
      applyPeriod();
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <Button variant="outline" onClick={applyPeriod}>
          Filtrar
        </Button>
        <Button onClick={handleCalculate} disabled={isPending} className="gap-1">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
          Calcular pagos
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild className="gap-1">
          <a href={`/api/pagos/export?periodStart=${start}&periodEnd=${end}`}>
            <FileSpreadsheet className="size-4" /> Excel
          </a>
        </Button>
        <Button variant="outline" asChild className="gap-1">
          <a href={`/api/pagos/export/pdf?periodStart=${start}&periodEnd=${end}`}>
            <Download className="size-4" /> PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
