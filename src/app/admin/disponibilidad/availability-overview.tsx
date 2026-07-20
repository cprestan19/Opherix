/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WEEKDAY_SHORT_LABELS } from "@/utils/date";
import { cn } from "@/lib/utils";

interface WorkerAvailability {
  id: string;
  photoUrl: string | null;
  user: { name: string };
  availabilitySlots: { dayOfWeek: number }[];
  timeOffs: { startDate: Date; endDate: Date }[];
}

export function AvailabilityOverview({ workers }: { workers: WorkerAvailability[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Disponibilidad del personal</CardTitle>
      </CardHeader>
      <CardContent>
        {workers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay personal activo todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground">Trabajador</th>
                  {WEEKDAY_SHORT_LABELS.map((label) => (
                    <th key={label} className="text-xs font-medium text-muted-foreground">
                      {label}
                    </th>
                  ))}
                  <th className="text-xs font-medium text-muted-foreground">Ausencias próximas</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => {
                  const days = new Set(worker.availabilitySlots.map((s) => s.dayOfWeek));
                  return (
                    <tr key={worker.id}>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.user.name} />
                            <AvatarFallback className="text-xs">
                              {worker.user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">{worker.user.name}</span>
                        </div>
                      </td>
                      {WEEKDAY_SHORT_LABELS.map((_, day) => (
                        <td key={day} className="text-center">
                          <span
                            className={cn(
                              "mx-auto block size-2.5 rounded-full",
                              days.has(day) ? "bg-success" : "bg-border",
                            )}
                          />
                        </td>
                      ))}
                      <td className="text-center text-xs text-muted-foreground">
                        {worker.timeOffs.length === 0
                          ? "—"
                          : new Intl.DateTimeFormat("es").format(worker.timeOffs[0].startDate)}
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
