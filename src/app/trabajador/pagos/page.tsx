/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { listPaymentRecordsForWorker } from "@/repositories/payment.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es").format(date);
}

export default async function PagosTrabajadorPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const records = await listPaymentRecordsForWorker(worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground">Consulta tus horas confirmadas y el estado de tus pagos.</p>
      </div>

      {records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no tienes pagos registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(record.periodStart)} – {formatDate(record.periodEnd)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(record.regularHours).toFixed(1)}h regulares ·{" "}
                    {Number(record.overtimeHours).toFixed(1)}h extra ·{" "}
                    {Number(record.sundayHours).toFixed(1)}h domingo ·{" "}
                    {Number(record.holidayHours).toFixed(1)}h feriado
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency(Number(record.totalAmount))}</span>
                  <Badge variant={record.status === "PAGADO" ? "secondary" : "outline"}>{record.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
