/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getCurrentUser, getEffectiveCompanyId } from "@/lib/tenant";
import { listInvoicesForClient } from "@/repositories/invoice.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function currency(value: unknown) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(value));
}

const STATUS_LABELS: Record<string, string> = { DRAFT: "Borrador", ISSUED: "Emitida", PAID: "Pagada" };

export default async function ClienteFacturasPage() {
  const user = await getCurrentUser();

  if (!user.clientId) {
    return <p className="text-sm text-muted-foreground">Tu usuario no está vinculado a una cuenta cliente.</p>;
  }

  const companyId = await getEffectiveCompanyId();
  const invoices = await listInvoicesForClient(companyId, user.clientId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historial y facturas</h1>
        <p className="text-sm text-muted-foreground">Consulta el detalle de facturación de tus eventos.</p>
      </div>

      {invoices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no tienes facturas emitidas.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{invoice.event?.title ?? "Evento"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es").format(invoice.periodStart)} –{" "}
                    {new Intl.DateTimeFormat("es").format(invoice.periodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency(invoice.amount)}</span>
                  <Badge variant={invoice.status === "PAID" ? "secondary" : "outline"}>
                    {STATUS_LABELS[invoice.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
