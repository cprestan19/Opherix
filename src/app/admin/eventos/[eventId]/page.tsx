/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { getEventDetail, findAvailableWorkersForSpecialty } from "@/repositories/event.repository";
import { getCompany } from "@/repositories/config.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { AssignmentPanel } from "./assignment-panel";
import { EventActions } from "./event-actions";
import { EventCheckInCode } from "@/components/shared/event-checkin-code";
import { InvoiceAction } from "./invoice-action";
import { EditEventForm } from "./edit-event-form";
import { ArchiveEventAction } from "./archive-event-action";
import { EventAccessLinkPanel } from "./event-access-link-panel";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Archivado",
};

function toDatetimeLocal(date: Date) {
  return date.toISOString().slice(0, 16);
}

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
  const [event, company] = await Promise.all([getEventDetail(companyId, eventId), getCompany(companyId)]);
  if (!event) notFound();

  const ratedAssignments = event.assignments.filter((a) => a.ratingScore !== null);

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
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
          {event.status !== "CANCELLED" && event.status !== "ARCHIVED" ? (
            <EditEventForm
              eventId={event.id}
              event={{
                title: event.title,
                eventType: event.eventType ?? "",
                address: event.address,
                startAt: toDatetimeLocal(event.startAt),
                endAt: toDatetimeLocal(event.endAt),
                notes: event.notes ?? "",
                staffRequirements: event.staffRequirements.map((r) => ({
                  specialty: r.specialty,
                  quantity: r.quantity,
                })),
              }}
            />
          ) : null}
        </div>
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
        {event.status === "COMPLETED" ? <ArchiveEventAction eventId={event.id} /> : null}
      </div>

      {event.status === "CONFIRMED" || event.status === "IN_PROGRESS" ? (
        <EventCheckInCode eventId={event.id} />
      ) : null}

      {event.status !== "DRAFT" ? (
        <EventAccessLinkPanel
          eventId={event.id}
          companySlug={company.slug}
          hasAccessToken={Boolean(event.accessToken)}
          accessTokenExpiresAt={event.accessTokenExpiresAt}
          accessClosedAt={event.accessClosedAt}
          eventEnded={event.endAt < new Date()}
          baseUrl={process.env.NEXTAUTH_URL ?? "http://localhost:3000"}
        />
      ) : null}

      {ratedAssignments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Star className="size-4 fill-warning text-warning" /> Calificación del cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ratedAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{a.worker.user.name}</p>
                  {a.ratingComment ? <p className="text-xs text-muted-foreground">{a.ratingComment}</p> : null}
                </div>
                <Badge variant={a.ratingModerationStatus === "PENDING_REVIEW" ? "secondary" : "default"}>
                  {a.ratingScore}/5{a.ratingModerationStatus === "PENDING_REVIEW" ? " · en revisión" : ""}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
