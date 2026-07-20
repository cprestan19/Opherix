/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listCheckInsForCompanyToday } from "@/repositories/checkin.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";

function formatTime(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default async function CheckInAdminPage() {
  const companyId = await getEffectiveCompanyId();
  const events = await listCheckInsForCompanyToday(companyId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-sm text-muted-foreground">Monitoreo de asistencia de los eventos de hoy.</p>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay eventos programados para hoy.
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="text-base font-medium">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {event.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin personal confirmado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {event.assignments.map((assignment) => (
                    <li key={assignment.id} className="flex items-center justify-between gap-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {assignment.worker.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                          {assignment.checkInAt && !assignment.checkOutAt ? (
                            <AvatarBadge className="bg-success" title="En sitio" />
                          ) : null}
                        </Avatar>
                        <span className="text-sm">{assignment.worker.user.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Entrada: {formatTime(assignment.checkInAt)}</span>
                        <span>Salida: {formatTime(assignment.checkOutAt)}</span>
                        {assignment.checkOutAt ? (
                          <Badge variant="secondary">Completado</Badge>
                        ) : assignment.checkInAt ? (
                          <Badge>En sitio</Badge>
                        ) : (
                          <Badge variant="outline">Sin registrar</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
