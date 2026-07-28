/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { AlertTriangle, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { specialtyLabels } from "@/lib/validations/worker-application";
import Link from "next/link";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

interface BreakdownRow {
  specialty: string;
  quantity: number;
  chargeToClient: number;
  subtotal: number;
}

// Deliberadamente solo muestra lo que se le cobra al cliente — cuánto se le
// paga al personal es información exclusiva de Pagos > Personal, nunca de
// la pantalla de evento (§ corrección explícita del usuario). Se calcula a
// partir del personal REALMENTE asignado (no de lo solicitado al inicio) —
// si asignas más o distinto personal del que se pidió, el total se ajusta.
export function EventStaffTotalsCard({
  chargeToClientTotal,
  breakdown,
  missingSpecialties,
  unassignedSpecialtyCount,
}: {
  chargeToClientTotal: number;
  breakdown: BreakdownRow[];
  missingSpecialties: string[];
  unassignedSpecialtyCount: number;
}) {
  const hasNothingToShow = breakdown.length === 0 && missingSpecialties.length === 0 && unassignedSpecialtyCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Calculator className="size-4 text-primary" /> Total a cobrar al cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-2xl font-semibold">{currency(chargeToClientTotal)}</p>

        {hasNothingToShow ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay personal asignado a este evento — el total se calcula del personal asignado, no de lo
            solicitado.
          </p>
        ) : null}

        {breakdown.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {breakdown.map((row) => (
              <li key={row.specialty} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {specialtyLabels[row.specialty as keyof typeof specialtyLabels]} × {row.quantity} (
                  {currency(row.chargeToClient)} c/u)
                </span>
                <span className="font-medium">{currency(row.subtotal)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {missingSpecialties.length > 0 ? (
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Falta configurar tarifa para: {missingSpecialties.map((s) => specialtyLabels[s as keyof typeof specialtyLabels]).join(", ")}.
            Este total está incompleto —{" "}
            <Link href="/admin/configuracion" className="underline">
              configúralas aquí
            </Link>
            .
          </p>
        ) : null}

        {unassignedSpecialtyCount > 0 ? (
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {unassignedSpecialtyCount} asignación{unassignedSpecialtyCount === 1 ? "" : "es"} sin especialidad
            definida (asignada fuera de este evento) — no {unassignedSpecialtyCount === 1 ? "cuenta" : "cuentan"} en
            el total. Quítala y reasígnala desde aquí para que sí cuente.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
