/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Filtro de fechas para "Pagos de clientes" — más simple que PeriodForm (sin calcular/exportar/trabajador). */
export function InvoicePeriodForm({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);

  function applyPeriod() {
    router.push(`${pathname}?view=clientes&periodStart=${start}&periodEnd=${end}`);
  }

  return (
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
    </div>
  );
}
