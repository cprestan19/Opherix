/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { listEventsForCompany } from "@/repositories/event.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { AssignedWorkersAvatarGroup } from "@/components/shared/assigned-workers-avatar-group";

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

export default async function EventosPage() {
  const companyId = await getEffectiveCompanyId();
  const events = await listEventsForCompany(companyId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          {events.length} evento(s) activos. Asigna personal y confirma cada solicitud.
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay eventos activos.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const acceptedCount = event.assignments.filter((a) => a.status === "ACCEPTED").length;
            const totalRequired = event.staffRequirements.reduce((sum, r) => sum + r.quantity, 0);
            return (
              <Link key={event.id} href={`/admin/eventos/${event.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{event.title}</p>
                      <Badge variant={STATUS_VARIANTS[event.status]}>{STATUS_LABELS[event.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.client.businessName} · {formatRange(event.startAt, event.endAt)} · {event.address}
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
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <AssignedWorkersAvatarGroup assignments={event.assignments} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
