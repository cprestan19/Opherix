/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import {
  getEventDetail,
  findAvailableWorkersForSpecialty,
  listPreferredWorkerSummaries,
} from "@/repositories/event.repository";
import { findInvoiceForEvent } from "@/repositories/invoice.repository";
import { getCompany } from "@/repositories/config.repository";
import { computeEventChargeTotal } from "@/services/client-specialty-rate.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, UserCheck } from "lucide-react";
import { asStringArray } from "@/lib/worker-fields";
import { AssignmentPanel } from "./assignment-panel";
import { EventActions } from "./event-actions";
import { EventCheckInCode } from "@/components/shared/event-checkin-code";
import { EventAmountCard } from "./event-amount-card";
import { EventStaffTotalsCard } from "./event-staff-totals-card";
import { EditEventForm } from "./edit-event-form";
import { ArchiveEventAction } from "./archive-event-action";
import { EventDeleteAction } from "./event-delete-action";
import { EventAccessLinkPanel } from "./event-access-link-panel";

const INVOICEABLE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

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
  const currentUser = await getCurrentUser();
  const isViewer = currentUser.role === "VIEWER";
  const companyId = await getEffectiveCompanyId();
  const [event, company] = await Promise.all([getEventDetail(companyId, eventId), getCompany(companyId)]);
  if (!event) notFound();

  const invoice = INVOICEABLE_STATUSES.includes(event.status) ? await findInvoiceForEvent(event.id) : null;
  const staffTotals = await computeEventChargeTotal(companyId, event.clientId, event.assignments);

  const ratedAssignments = event.assignments.filter((a) => a.ratingScore !== null);

  const uniqueSpecialties = [...new Set(event.staffRequirements.map((r) => r.specialty))];
  const workersLists = await Promise.all(
    uniqueSpecialties.map((specialty) => findAvailableWorkersForSpecialty(companyId, specialty)),
  );
  const availableWorkersBySpecialty = Object.fromEntries(
    uniqueSpecialties.map((specialty, i) => [specialty, workersLists[i]]),
  );

  const preferredWorkerIds = asStringArray(event.preferredWorkerIds);
  const preferredWorkers = await listPreferredWorkerSummaries(companyId, preferredWorkerIds);
  const alreadyAssignedWorkerIds = new Set(
    event.assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED").map((a) => a.worker.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {event.client.businessName} · {formatRange(event.startAt, event.endAt)}
          </p>
          {event.deletedAt && event.deletedReason ? (
            <p className="mt-1 text-xs text-muted-foreground">Motivo de eliminación: {event.deletedReason}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
          {event.deletedAt ? <Badge variant="destructive">Eliminado</Badge> : null}
          {!isViewer && !event.deletedAt && event.status !== "CANCELLED" && event.status !== "ARCHIVED" ? (
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

      {isViewer ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {event.deletedAt ? null : (
            <>
              <EventActions eventId={event.id} status={event.status} />
              {event.status === "COMPLETED" ? <ArchiveEventAction eventId={event.id} /> : null}
            </>
          )}
          <EventDeleteAction eventId={event.id} deleted={Boolean(event.deletedAt)} />
        </div>
      )}

      {!event.deletedAt ? (
        <EventStaffTotalsCard
          chargeToClientTotal={staffTotals.chargeToClientTotal}
          breakdown={staffTotals.breakdown}
          missingSpecialties={staffTotals.missingSpecialties}
          unassignedSpecialtyCount={staffTotals.unassignedSpecialtyCount}
        />
      ) : null}

      {!isViewer && !event.deletedAt && INVOICEABLE_STATUSES.includes(event.status) ? (
        <EventAmountCard
          eventId={event.id}
          invoice={invoice ? { id: invoice.id, amount: invoice.amount.toString(), status: invoice.status } : null}
          suggestedAmount={staffTotals.chargeToClientTotal}
        />
      ) : null}

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

      {preferredWorkers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <UserCheck className="size-4 text-primary" /> Personal preferido por el cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {preferredWorkers.map((worker) => (
              <Link
                key={worker.id}
                href={`/admin/personal/${worker.id}`}
                className="flex items-center gap-2 rounded-lg border border-border p-2 pr-3 transition-colors hover:border-primary/40"
              >
                <Avatar className="size-8">
                  <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.user.name} />
                  <AvatarFallback className="text-xs">{worker.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{worker.user.name}</span>
                {alreadyAssignedWorkerIds.has(worker.id) ? (
                  <Badge variant="secondary" className="text-xs">
                    Ya asignado
                  </Badge>
                ) : null}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <AssignmentPanel
        eventId={event.id}
        requirements={event.staffRequirements}
        assignments={event.assignments}
        availableWorkersBySpecialty={availableWorkersBySpecialty}
        readOnly={isViewer}
      />
    </div>
  );
}
