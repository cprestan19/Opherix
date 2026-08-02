/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { CalendarClock, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";
import { assignWorkerToEventFromAvailabilityAction } from "./actions";
import { formatTime12h } from "@/utils/date";

export interface AssignableEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  client: { businessName: string };
}

function formatRange(start: Date, end: Date) {
  const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });
  return `${dateFmt.format(start)} · ${formatTime12h(start)} – ${formatTime12h(end)}`;
}

export function AssignEventModal({
  workerId,
  workerName,
  events,
}: {
  workerId: string;
  workerName: string;
  events: AssignableEvent[];
}) {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = events.find((e) => e.id === eventId);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setEventId("");
      setError(null);
    }
    setOpen(next);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    const result = await assignWorkerToEventFromAvailabilityAction(eventId, workerId);
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(`${workerName} fue asignado y notificado`);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="size-3.5" /> Asignar evento
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar evento a {workerName}</DialogTitle>
          <DialogDescription>
            Elige el evento — el día y la hora quedan definidos por el evento seleccionado. Se le notificará de
            inmediato.
          </DialogDescription>
        </DialogHeader>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos activos disponibles para asignar.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} · {event.client.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selected ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="size-3.5 shrink-0" />
                {formatRange(selected.startAt, selected.endAt)}
              </p>
            ) : null}
          </div>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={isSubmitting || !eventId}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Asignar y notificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
