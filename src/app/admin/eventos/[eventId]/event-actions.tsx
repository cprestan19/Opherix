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
import { CheckCircle2, ClipboardList, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import {
  confirmEventAction,
  cancelEventAction,
  completeEventAction,
  resendWorkOrderAction,
  resendBatchWorkOrderAction,
} from "./actions";

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

/**
 * Envuelve un botón con un tooltip explicando su función al pasar el mouse.
 * El trigger real es el <span>, no el botón — un botón disabled tiene
 * pointer-events-none (§ button.tsx) y nunca dispararía el hover, justo
 * cuando más hace falta explicar por qué está deshabilitado.
 */
function HintButton({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Solo visible una vez el evento está COMPLETED/ARCHIVED (§ completeEvent —
 * el roster de personal recién es definitivo ahí, antes puede seguir
 * variando). El envío por WhatsApp + correo ya se disparó automático al
 * completar; "Reenviar" es el respaldo manual, con casilla de teléfono para
 * mandarla a otro contacto además del registrado en el Cliente.
 */
function WorkOrderPanel({
  eventId,
  clientPhone,
  batchId,
  batchEventCount,
}: {
  eventId: string;
  clientPhone: string | null;
  batchId?: string | null;
  batchEventCount?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");

  function handleResend() {
    startTransition(async () => {
      const result = batchId
        ? await resendBatchWorkOrderAction(batchId, phone)
        : await resendWorkOrderAction(eventId, phone);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Orden de trabajo reenviada por WhatsApp y correo");
    });
  }

  const workOrderHref = batchId ? `/api/eventos/lote/${batchId}/orden-trabajo` : `/api/eventos/${eventId}/orden-trabajo`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <HintButton
        hint={
          batchId
            ? `Abre el PDF de la orden de trabajo consolidada de los ${batchEventCount} eventos de este lote.`
            : "Abre el PDF de la orden de trabajo en una pestaña nueva."
        }
      >
        <Button variant="outline" className="gap-1.5" asChild>
          <a href={workOrderHref} target="_blank" rel="noopener noreferrer">
            <ClipboardList className="size-4" /> {batchId ? "Ver orden de trabajo del lote" : "Ver orden de trabajo"}
          </a>
        </Button>
      </HintButton>
      <Input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={clientPhone ? `Reenviar a ${clientPhone}` : "Teléfono (opcional)"}
        className="w-48"
        title="Dejalo vacío para reenviar al teléfono del cliente, o escribí otro número para mandarla a alguien más."
      />
      <HintButton hint="Reenvía la orden de trabajo (PDF) por WhatsApp y correo, al cliente o al teléfono de arriba.">
        <Button type="button" variant="outline" className="gap-1.5" disabled={isPending} onClick={handleResend}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Reenviar OT
        </Button>
      </HintButton>
    </div>
  );
}

export function EventActions({
  eventId,
  status,
  hasAssignments,
  clientPhone,
  batchId,
  batchEventCount,
}: {
  eventId: string;
  status: string;
  hasAssignments: boolean;
  clientPhone: string | null;
  batchId?: string | null;
  batchEventCount?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (status === "CANCELLED") return null;

  if (status === "COMPLETED" || status === "ARCHIVED") {
    return (
      <WorkOrderPanel
        eventId={eventId}
        clientPhone={clientPhone}
        batchId={batchId}
        batchEventCount={batchEventCount}
      />
    );
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeEventAction(eventId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Evento completado — factura al cliente por ${currency(result.chargeToClientTotal ?? 0)}, ${result.workersNotified ?? 0} pago(s) generado(s) al personal. Orden de trabajo enviada al cliente.`,
      );
      setCompleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <HintButton hint="Cancela el evento y notifica a los trabajadores asignados por WhatsApp/push/email.">
          <DialogTrigger asChild>
            <Button variant="outline" className="text-danger">
              Cancelar evento
            </Button>
          </DialogTrigger>
        </HintButton>
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
        <HintButton hint="Confirma la solicitud del cliente y le avisa por WhatsApp y correo.">
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
        </HintButton>
      ) : null}
      {status === "CONFIRMED" || status === "IN_PROGRESS" ? (
        <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
          <HintButton
            hint={
              hasAssignments
                ? "Genera factura y pagos, notifica al personal, y envía la orden de trabajo final al cliente."
                : "Asigná al menos un trabajador antes de poder completar el evento."
            }
          >
            <DialogTrigger asChild>
              {/* Sin personal asignado no hay orden de trabajo que generar/enviar
                  (§ sendWorkOrderToClient exige al menos 1 asignación activa) */}
              <Button className="gap-1.5" disabled={!hasAssignments}>
                <CheckCircle2 className="size-4" /> Marcar completado
              </Button>
            </DialogTrigger>
          </HintButton>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar evento como completado</DialogTitle>
              <DialogDescription>
                Se emitirá/actualizará la factura al cliente con el total calculado del personal asignado, se
                generará el pago pendiente de cada trabajador asignado, se les notificará, y se enviará la orden de
                trabajo final al cliente por WhatsApp y correo. Esta acción no se puede deshacer.
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
