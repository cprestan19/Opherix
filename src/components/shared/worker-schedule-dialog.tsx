/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";
import { DayTimeline, dayKey, groupByDay } from "@/components/shared/day-timeline";

export interface WorkerAssignmentPreview {
  id: string;
  status: string;
  event: { title: string; address: string; startAt: Date; endAt: Date };
}

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Propuesta",
  ACCEPTED: "Confirmada",
};

function formatRange(start: Date, end: Date) {
  const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });
  const timeFmt = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

export function WorkerScheduleDialog({
  workerName,
  assignments,
  onRemove,
  children,
}: {
  workerName: string;
  assignments: WorkerAssignmentPreview[];
  /** Si se provee, cada asignación muestra un botón para quitar al trabajador de ese evento (para reemplazarlo por otro). */
  onRemove?: (assignmentId: string) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const [items, setItems] = useState(assignments);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-sincroniza con la prop cada vez que el diálogo se abre (patrón
  // "ajustar estado durante el render" de React, sin useEffect) — así se
  // refleja cualquier cambio ocurrido mientras estuvo cerrado.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setItems(assignments);
  }

  const dayGroups = groupByDay(items);

  function handleRemove(assignmentId: string, eventTitle: string) {
    if (!onRemove) return;
    setRemovingId(assignmentId);
    startTransition(async () => {
      try {
        await onRemove(assignmentId);
        setItems((prev) => prev.filter((item) => item.id !== assignmentId));
        toast.success(`${workerName} fue quitado de "${eventTitle}". Ya puedes asignar a otro trabajador.`);
      } catch {
        toast.error("No se pudo quitar la asignación. Intenta de nuevo.");
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {children}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agenda de {workerName}</DialogTitle>
          <DialogDescription>
            Próximas asignaciones confirmadas o propuestas — la línea de tiempo muestra en qué horas
            exactas está ocupada cada día, para ver si queda espacio para otro evento.
          </DialogDescription>
        </DialogHeader>
        {dayGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin asignaciones próximas.</p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto">
            {dayGroups.map(({ day, items: dayItems }) => (
              <div key={dayKey(day)} className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  {new Intl.DateTimeFormat("es", { weekday: "long", day: "2-digit", month: "long" }).format(day)}
                </p>
                <DayTimeline
                  day={day}
                  blocks={dayItems.map((a) => ({
                    startAt: a.event.startAt,
                    endAt: a.event.endAt,
                    label: `${a.event.title} · ${formatRange(a.event.startAt, a.event.endAt)}`,
                  }))}
                />
                <ul className="flex flex-col gap-2">
                  {dayItems.map((a) => (
                    <li key={a.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{a.event.title}</p>
                        <Badge variant={a.status === "ACCEPTED" ? "default" : "secondary"}>
                          {STATUS_LABELS[a.status] ?? a.status}
                        </Badge>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarClock className="size-3.5 shrink-0" />
                        {formatRange(a.event.startAt, a.event.endAt)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {a.event.address}
                      </p>
                      {onRemove ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-1.5 text-danger"
                          disabled={isPending && removingId === a.id}
                          onClick={() => handleRemove(a.id, a.event.title)}
                        >
                          {isPending && removingId === a.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <X className="size-3.5" />
                          )}
                          Quitar de este evento
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
