/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setEventAmountAction, markInvoicePaidAction } from "@/app/admin/pagos/actions";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export function EventAmountCard({
  eventId,
  invoice,
}: {
  eventId: string;
  invoice: { id: string; amount: string; status: "DRAFT" | "ISSUED" | "PAID" } | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(invoice?.amount ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isPaid = invoice?.status === "PAID";

  async function handleSave() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    setIsSaving(true);
    const result = await setEventAmountAction(eventId, parsed);
    setIsSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Monto a pagar guardado");
    router.refresh();
  }

  async function handleMarkCancelled() {
    if (!invoice) return;
    setIsCancelling(true);
    const result = await markInvoicePaidAction(invoice.id, eventId);
    setIsCancelling(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cobro marcado como cancelado — se registró como ingreso");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <DollarSign className="size-4 text-primary" /> Monto a pagar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {isPaid ? (
          <span className="text-lg font-semibold">{currency(Number(invoice?.amount))}</span>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Monto (USD)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-36"
            />
            <Button size="sm" variant="outline" disabled={isSaving} onClick={handleSave}>
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        )}

        <Badge variant={isPaid ? "secondary" : invoice ? "outline" : "outline"}>
          {isPaid ? "Cancelado" : invoice ? "Pendiente de cobro" : "Sin monto"}
        </Badge>

        {invoice && !isPaid ? (
          <Button size="sm" className="gap-1.5" disabled={isCancelling} onClick={handleMarkCancelled}>
            {isCancelling ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Marcar como cancelado
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
