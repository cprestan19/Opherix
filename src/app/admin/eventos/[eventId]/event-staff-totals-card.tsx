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

export function EventStaffTotalsCard({
  chargeToClientTotal,
  payToWorkerTotal,
  missingSpecialties,
}: {
  chargeToClientTotal: number;
  payToWorkerTotal: number;
  missingSpecialties: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Calculator className="size-4 text-primary" /> Total calculado del personal solicitado
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Cobro al cliente</p>
            <p className="text-lg font-semibold">{currency(chargeToClientTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pago al personal</p>
            <p className="text-lg font-semibold">{currency(payToWorkerTotal)}</p>
          </div>
        </div>
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
      </CardContent>
    </Card>
  );
}
