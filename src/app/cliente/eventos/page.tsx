/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getCurrentUser, getEffectiveCompanyId } from "@/lib/tenant";
import { listEventsForClient } from "@/repositories/event.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { EventForm } from "./event-form";
import { RatingDialog } from "./rating-dialog";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_VARIANTS: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  DRAFT: "outline",
  REQUESTED: "outline",
  CONFIRMED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export default async function ClienteEventosPage() {
  const user = await getCurrentUser();

  if (!user.clientId) {
    return <p className="text-sm text-muted-foreground">Tu usuario no está vinculado a una cuenta cliente.</p>;
  }

  const companyId = await getEffectiveCompanyId();
  const events = await listEventsForClient(companyId, user.clientId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis eventos</h1>
          <p className="text-sm text-muted-foreground">Solicita personal y da seguimiento a tus eventos.</p>
        </div>
        <EventForm />
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no has solicitado ningún evento.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const acceptedCount = event.assignments.filter((a) => a.status === "ACCEPTED").length;
            const totalRequired = event.staffRequirements.reduce((sum, r) => sum + r.quantity, 0);
            return (
              <Card key={event.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant={STATUS_VARIANTS[event.status]}>{STATUS_LABELS[event.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatRange(event.startAt, event.endAt)} · {event.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {event.staffRequirements.map((req) => (
                      <Badge key={req.id} variant="outline">
                        {specialtyLabels[req.specialty]} x{req.quantity}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {acceptedCount}/{totalRequired} confirmados
                    </span>
                  </div>
                  {event.status === "COMPLETED" ? (
                    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
                      {event.assignments
                        .filter((a) => a.status === "ACCEPTED")
                        .map((a) => (
                          <div key={a.id} className="flex items-center justify-between gap-2">
                            <span className="text-sm">{a.worker.user.name}</span>
                            {a.ratingScore !== null ? (
                              <Badge variant="secondary">Calificado: {a.ratingScore}/5</Badge>
                            ) : (
                              <RatingDialog assignmentId={a.id} workerName={a.worker.user.name} />
                            )}
                          </div>
                        ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
