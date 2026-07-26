/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { issueInvoiceAction } from "./actions";

export function InvoiceAction({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    const result = await issueInvoiceAction(eventId, Number(amount));
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Factura emitida correctamente");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Receipt className="size-4" /> Emitir factura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emitir factura al cliente</DialogTitle>
          <DialogDescription>
            Registro contable — no procesa el cobro. El cliente verá esta factura en su portal.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Monto (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Emitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
