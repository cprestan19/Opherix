/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { confirmEventAction, cancelEventAction } from "./actions";

export function EventActions({ eventId, status }: { eventId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (status === "CANCELLED" || status === "COMPLETED") return null;

  return (
    <div className="flex gap-2">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-danger">
            Cancelar evento
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar evento</DialogTitle>
            <DialogDescription>Esta acción notificará a los trabajadores asignados.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await cancelEventAction(eventId, reason || "No especificado");
                  setDialogOpen(false);
                })
              }
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {status === "REQUESTED" ? (
        <Button disabled={isPending} onClick={() => startTransition(() => confirmEventAction(eventId))}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirmar evento
        </Button>
      ) : null}
    </div>
  );
}
