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
import { Loader2, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";
import { setWorkerHourlyRateAction } from "./actions";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

/** Solo Administrador la ve/edita — con esto se calculan los pagos automáticos (§ payment.service.ts). */
export function WorkerHourlyRate({ workerId, hourlyRate }: { workerId: string; hourlyRate: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(hourlyRate?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await setWorkerHourlyRateAction(workerId, parsed);
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Tarifa por hora actualizada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Tarifa por hora</p>
            <p className="text-xs text-muted-foreground">
              Fija — con esto se calcula el pago automático por horas trabajadas. Solo visible para Administrador.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-lg font-semibold text-foreground">
            {hourlyRate != null ? currency(hourlyRate) : "Sin definir"}
          </span>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
              <Pencil className="size-3.5" /> Editar
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tarifa por hora</DialogTitle>
                <DialogDescription>Monto fijo en USD por cada hora trabajada.</DialogDescription>
              </DialogHeader>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Ej. 3.50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <DialogFooter>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
