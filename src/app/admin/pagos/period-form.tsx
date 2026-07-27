/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Calculator, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculatePaymentsAction } from "./actions";

interface WorkerOption {
  id: string;
  name: string;
}

export function PeriodForm({
  periodStart,
  periodEnd,
  workerId,
  workers,
}: {
  periodStart: string;
  periodEnd: string;
  workerId: string;
  workers: WorkerOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workerId);
  const [isPending, startTransition] = useTransition();

  function applyPeriod() {
    const params = new URLSearchParams({ periodStart: start, periodEnd: end });
    if (selectedWorkerId) params.set("workerId", selectedWorkerId);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleCalculate() {
    startTransition(async () => {
      await calculatePaymentsAction(start, end);
      toast.success("Pagos calculados correctamente");
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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Trabajador</label>
          <Select value={selectedWorkerId || "all"} onValueChange={(v) => setSelectedWorkerId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
