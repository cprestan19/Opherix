/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT_LABELS } from "@/utils/date";
import { FRANJAS, computeOccupiedFranjaKeys } from "@/lib/availability-franjas";
import { DayTimeline, dayKey, groupByDay } from "@/components/shared/day-timeline";
import type { WorkerAssignmentPreview } from "@/components/shared/worker-schedule-dialog";

interface WorkerAvailabilityGridProps {
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  upcomingAssignments: WorkerAssignmentPreview[];
}

/**
 * Disponibilidad de un trabajador para admin/cliente, en dos niveles:
 * 1. Franja semanal (Mañana/Tarde/Noche) — vista rápida, verde/gris/violeta.
 * 2. Línea de tiempo en horas exactas por día próximo con evento — para que
 *    el admin vea si le queda espacio para asignar otro evento el mismo día
 *    en otro horario, en vez de asumir que "todo el día" está ocupado.
 */
export function WorkerAvailabilityGrid({ slots, upcomingAssignments }: WorkerAvailabilityGridProps) {
  const activeKeys = new Set(slots.map((s) => `${s.dayOfWeek}-${s.startTime}-${s.endTime}`));
  const occupiedRanges = upcomingAssignments.map((a) => a.event);
  const occupiedKeys = computeOccupiedFranjaKeys(occupiedRanges);
  const dayGroups = groupByDay(upcomingAssignments);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {occupiedKeys.size > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5 text-primary">
              <CalendarClock className="size-3.5" />
              <span className="inline-block size-2.5 rounded-full bg-primary" /> Ocupado (evento asignado)
            </span>
            <span className="flex items-center gap-1.5 text-success">
              <span className="inline-block size-2.5 rounded-full bg-success" /> Disponible
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block size-2.5 rounded-full bg-border" /> No disponible
            </span>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-fit min-w-[360px] max-w-xl border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-12 text-left text-xs font-medium text-muted-foreground">Franja</th>
                {WEEKDAY_SHORT_LABELS.map((label) => (
                  <th key={label} className="w-9 text-xs font-medium text-muted-foreground">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRANJAS.map((franja) => (
                <tr key={franja.key}>
                  <td className="py-1 pr-2 text-xs text-muted-foreground">{franja.label}</td>
                  {WEEKDAY_SHORT_LABELS.map((_, day) => {
                    const isActive = activeKeys.has(`${day}-${franja.start}-${franja.end}`);
                    const isOccupied = occupiedKeys.has(`${day}-${franja.key}`);
                    return (
                      <td key={day} className="p-1 text-center">
                        <div
                          title={isOccupied ? "Ya tiene un evento asignado en este horario" : undefined}
                          className={cn(
                            "relative flex size-7 items-center justify-center rounded-md border text-xs",
                            isOccupied
                              ? "border-primary bg-primary/10"
                              : isActive
                                ? "border-success bg-success/10"
                                : "border-border bg-background",
                          )}
                        >
                          {isOccupied ? (
                            <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dayGroups.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Horas exactas ocupadas por día — útil para ver si queda espacio para otro evento.
          </p>
          {dayGroups.map(({ day, items }) => (
            <div key={dayKey(day)} className="flex flex-col gap-1">
              <p className="text-xs font-medium">
                {new Intl.DateTimeFormat("es", { weekday: "long", day: "2-digit", month: "long" }).format(day)}
              </p>
              <DayTimeline
                day={day}
                blocks={items.map((a) => ({
                  startAt: a.event.startAt,
                  endAt: a.event.endAt,
                  label: a.event.title,
                }))}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
