/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { getEventDetail, findAvailableWorkersForSpecialty } from "@/repositories/event.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentPanel } from "./assignment-panel";
import { EventActions } from "./event-actions";
import { EventCheckInCode } from "@/components/shared/event-checkin-code";
import { InvoiceAction } from "./invoice-action";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const companyId = await getEffectiveCompanyId();
  const event = await getEventDetail(companyId, eventId);
  if (!event) notFound();

  const uniqueSpecialties = [...new Set(event.staffRequirements.map((r) => r.specialty))];
  const workersLists = await Promise.all(
    uniqueSpecialties.map((specialty) => findAvailableWorkersForSpecialty(companyId, specialty)),
  );
  const availableWorkersBySpecialty = Object.fromEntries(
    uniqueSpecialties.map((specialty, i) => [specialty, workersLists[i]]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {event.client.businessName} · {formatRange(event.startAt, event.endAt)}
          </p>
        </div>
        <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
      </div>

      <Card>
        <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Ubicación: </span>
            {event.address}
          </p>
          <p>
            <span className="text-muted-foreground">Contacto: </span>
            {event.client.contactName} · {event.client.contactPhone}
          </p>
          {event.notes ? (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Notas: </span>
              {event.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <EventActions eventId={event.id} status={event.status} />
        {event.status === "COMPLETED" ? <InvoiceAction eventId={event.id} /> : null}
      </div>

      {event.status === "CONFIRMED" || event.status === "IN_PROGRESS" ? (
        <EventCheckInCode eventId={event.id} />
      ) : null}

      <AssignmentPanel
        eventId={event.id}
        requirements={event.staffRequirements}
        assignments={event.assignments}
        availableWorkersBySpecialty={availableWorkersBySpecialty}
      />
    </div>
  );
}
