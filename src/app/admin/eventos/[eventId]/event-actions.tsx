/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
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
import { confirmEventAction, cancelEventAction, completeEventAction, getWorkOrderWhatsAppLinkAction } from "./actions";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export function EventActions({
  eventId,
  status,
  hasAssignments,
}: {
  eventId: string;
  status: string;
  hasAssignments: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (status === "CANCELLED" || status === "COMPLETED" || status === "ARCHIVED") return null;

  function handleSendWorkOrderWhatsApp() {
    startTransition(async () => {
      const result = await getWorkOrderWhatsAppLinkAction(eventId);
      if (result?.error || !result.url) {
        toast.error(result?.error ?? "No se pudo generar el enlace.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeEventAction(eventId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Evento completado — factura al cliente por ${currency(result.chargeToClientTotal ?? 0)}, ${result.workersNotified ?? 0} pago(s) generado(s) al personal.`,
      );
      setCompleteOpen(false);
      router.refresh();
    });
  }

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
                  toast.success("Evento cancelado");
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
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await confirmEventAction(eventId);
              toast.success("Evento confirmado");
            })
          }
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirmar evento
        </Button>
      ) : null}
      {(status === "CONFIRMED" || status === "IN_PROGRESS") && hasAssignments ? (
        <>
          <Button variant="outline" className="gap-1.5" asChild>
            <a href={`/api/eventos/${eventId}/orden-trabajo`} target="_blank" rel="noopener noreferrer">
              <ClipboardList className="size-4" /> Orden de trabajo
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={isPending}
            onClick={handleSendWorkOrderWhatsApp}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            Enviar por WhatsApp
          </Button>
        </>
      ) : null}
      {status === "CONFIRMED" || status === "IN_PROGRESS" ? (
        <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <CheckCircle2 className="size-4" /> Marcar completado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar evento como completado</DialogTitle>
              <DialogDescription>
                Se emitirá/actualizará la factura al cliente con el total calculado del personal asignado, se
                generará el pago pendiente de cada trabajador asignado, y se les notificará. Esta acción no se
                puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteOpen(false)}>
                Volver
              </Button>
              <Button disabled={isPending} onClick={handleComplete} className="gap-1.5">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
