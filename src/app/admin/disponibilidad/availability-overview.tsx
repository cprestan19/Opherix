/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WEEKDAY_SHORT_LABELS, getCurrentWeekRange, formatWeekLabel } from "@/utils/date";
import { cn } from "@/lib/utils";
import { WorkerScheduleDialog, type WorkerAssignmentPreview } from "@/components/shared/worker-schedule-dialog";
import { AssignEventModal, type AssignableEvent } from "./assign-event-modal";
import { removeAssignmentFromAvailabilityAction } from "./actions";

interface WorkerAvailability {
  id: string;
  photoUrl: string | null;
  user: { name: string };
  availabilitySlots: { dayOfWeek: number }[];
  timeOffs: { startDate: Date; endDate: Date }[];
  assignments: WorkerAssignmentPreview[];
}

function occupiedWeekdays(assignments: WorkerAssignmentPreview[]): Set<number> {
  return new Set(assignments.map((a) => a.event.startAt.getDay()));
}

export function AvailabilityOverview({ workers, events }: { workers: WorkerAvailability[]; events: AssignableEvent[] }) {
  const { start, end } = getCurrentWeekRange();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">Disponibilidad del personal</CardTitle>
          <span className="text-xs font-medium text-muted-foreground">{formatWeekLabel(start, end)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Horario recurrente semanal — se repite todas las semanas. Haz clic en un trabajador para ver dónde está
          asignado y el horario.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
          <span className="flex items-center gap-1.5 text-primary">
            <span className="inline-block size-2.5 rounded-full bg-primary" /> Ocupado (evento asignado)
          </span>
          <span className="flex items-center gap-1.5 text-success">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Disponible
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block size-2.5 rounded-full bg-border" /> No disponible
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {workers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay personal activo todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground">Trabajador</th>
                  {WEEKDAY_SHORT_LABELS.map((label) => (
                    <th key={label} className="text-xs font-medium text-muted-foreground">
                      {label}
                    </th>
                  ))}
                  <th className="text-xs font-medium text-muted-foreground">Ausencias próximas</th>
                  <th className="text-xs font-medium text-muted-foreground">Próxima asignación</th>
                  <th className="text-xs font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => {
                  const days = new Set(worker.availabilitySlots.map((s) => s.dayOfWeek));
                  const occupiedDays = occupiedWeekdays(worker.assignments);
                  const nextAssignment = worker.assignments[0];
                  return (
                    <tr key={worker.id}>
                      <td className="py-1.5">
                        <WorkerScheduleDialog
                          workerName={worker.user.name}
                          assignments={worker.assignments}
                          onRemove={removeAssignmentFromAvailabilityAction}
                        >
                          <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
                            <Avatar className="size-7">
                              <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.user.name} />
                              <AvatarFallback className="text-xs">
                                {worker.user.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">{worker.user.name}</span>
                          </div>
                        </WorkerScheduleDialog>
                      </td>
                      {WEEKDAY_SHORT_LABELS.map((_, day) => (
                        <td key={day} className="text-center">
                          <span
                            title={occupiedDays.has(day) ? "Ya tiene un evento asignado este día" : undefined}
                            className={cn(
                              "mx-auto block size-2.5 rounded-full",
                              occupiedDays.has(day)
                                ? "bg-primary"
                                : days.has(day)
                                  ? "bg-success"
                                  : "bg-border",
                            )}
                          />
                        </td>
                      ))}
                      <td className="text-center text-xs text-muted-foreground">
                        {worker.timeOffs.length === 0
                          ? "—"
                          : new Intl.DateTimeFormat("es").format(worker.timeOffs[0].startDate)}
                      </td>
                      <td className="text-center text-xs text-muted-foreground">
                        {nextAssignment
                          ? `${nextAssignment.event.title} · ${new Intl.DateTimeFormat("es", {
                              day: "2-digit",
                              month: "short",
                            }).format(nextAssignment.event.startAt)}`
                          : "Sin asignar"}
                      </td>
                      <td className="text-center">
                        <AssignEventModal workerId={worker.id} workerName={worker.user.name} events={events} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
