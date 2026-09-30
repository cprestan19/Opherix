/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listEventsForCompany } from "@/repositories/event.repository";
import { listClients } from "@/services/client.service";
import { listDeletedEvents } from "@/services/event.service";
import { listActiveSpecialties } from "@/services/specialty.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AssignedWorkersAvatarGroup } from "@/components/shared/assigned-workers-avatar-group";
import { EventForm } from "./event-form";
import { ArchiveEventQuickAction } from "./archive-event-quick-action";
import { ClientForm } from "@/app/admin/clientes/client-form";
import { formatDateTime12h } from "@/utils/date";

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Archivado",
};

const STATUS_VARIANTS: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  DRAFT: "outline",
  REQUESTED: "outline",
  CONFIRMED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  ARCHIVED: "outline",
};

const STATUS_HINTS: Record<string, string> = {
  DRAFT: "Borrador — todavía no se envió al Administrador.",
  REQUESTED: "El cliente solicitó el evento; falta confirmarlo.",
  CONFIRMED: "El Administrador confirmó el evento al cliente.",
  IN_PROGRESS: "Hay personal que ya hizo check-in en el evento.",
  COMPLETED: "El evento terminó: factura y pagos ya se generaron.",
  CANCELLED: "El evento fue cancelado.",
  ARCHIVED: "El evento está archivado — oculto de la lista de activos.",
};

function formatRange(start: Date, end: Date) {
  const dateOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${formatDateTime12h(start, dateOptions)} – ${formatDateTime12h(end, dateOptions)}`;
}

type EventListItem = Awaited<ReturnType<typeof listEventsForCompany>>[number];

/** Cuerpo de la tarjeta de un evento — se usa igual suelto o anidado dentro de un grupo de lote. */
function EventCardBody({ event, isViewer }: { event: EventListItem; isViewer: boolean }) {
  const acceptedCount = event.assignments.filter((a) => a.status === "ACCEPTED").length;
  const totalRequired = event.staffRequirements.reduce((sum, r) => sum + r.quantity, 0);
  return (
    <CardContent className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">{event.title}</p>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Badge variant={STATUS_VARIANTS[event.status]}>{STATUS_LABELS[event.status]}</Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent>{STATUS_HINTS[event.status]}</TooltipContent>
          </Tooltip>
          {!isViewer && event.status !== "ARCHIVED" ? <ArchiveEventQuickAction eventId={event.id} /> : null}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {event.client.businessName} · {formatRange(event.startAt, event.endAt)} · {event.address}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {event.staffRequirements.map((req) => (
          <Badge key={req.id} variant="outline">
            {req.specialty.name} x{req.quantity}
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
  );
}

/** Agrupa eventos que nacieron del mismo envío de un cliente (§ Event.batchId) — el resto queda como grupo de 1. */
function groupEventsByBatch(events: EventListItem[]) {
  const groups: EventListItem[][] = [];
  const indexByBatchId = new Map<string, number>();

  for (const event of events) {
    if (!event.batchId) {
      groups.push([event]);
      continue;
    }
    const existingIndex = indexByBatchId.get(event.batchId);
    if (existingIndex === undefined) {
      indexByBatchId.set(event.batchId, groups.length);
      groups.push([event]);
    } else {
      groups[existingIndex].push(event);
    }
  }

  return groups;
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; eliminados?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const isViewer = currentUser.role === "VIEWER";
  const companyId = await getEffectiveCompanyId();
  const { archived: archivedParam, eliminados } = await searchParams;
  const archived = archivedParam === "1";
  const showDeleted = eliminados === "1";

  if (showDeleted) {
    const deletedEvents = isViewer ? [] : await listDeletedEvents(companyId);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Eventos eliminados</h1>
            <p className="text-sm text-muted-foreground">{deletedEvents.length} evento(s) eliminado(s).</p>
          </div>
          <Link
            href="/admin/eventos"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Volver a eventos
          </Link>
        </div>
        {deletedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay eventos eliminados.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {deletedEvents.map((event) => (
              <Link key={event.id} href={`/admin/eventos/${event.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{event.title}</p>
                      <Badge variant="destructive">Eliminado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.client.businessName} · {formatRange(event.startAt, event.endAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Eliminado {event.deletedAt ? dateFormatter.format(event.deletedAt) : ""}
                      {event.deletedReason ? ` · ${event.deletedReason}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const [events, clients, specialties] = await Promise.all([
    listEventsForCompany(companyId, { archived }),
    listClients(companyId),
    listActiveSpecialties(companyId),
  ]);
  const activeClients = clients.filter((client) => client.isActive);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            {archived
              ? `${events.length} evento(s) archivado(s).`
              : `${events.length} evento(s) activos. Asigna personal y confirma cada solicitud.`}
          </p>
        </div>
        {isViewer ? null : (
          <div className="flex gap-2">
            <ClientForm />
            <EventForm clients={activeClients} specialties={specialties} />
          </div>
        )}
      </div>

      <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/admin/eventos"
              className={cn(
                "rounded-md px-3 py-1 transition-colors",
                !archived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Activos
            </Link>
          </TooltipTrigger>
          <TooltipContent>Eventos en curso: desde solicitados hasta completados, sin archivar.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/admin/eventos?archived=1"
              className={cn(
                "rounded-md px-3 py-1 transition-colors",
                archived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Archivados
            </Link>
          </TooltipTrigger>
          <TooltipContent>Eventos archivados manualmente — fuera de la lista de activos.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/admin/eventos?eliminados=1"
              className="rounded-md px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              Eliminados
            </Link>
          </TooltipTrigger>
          <TooltipContent>Eventos borrados (soft-delete) — se pueden restaurar.</TooltipContent>
        </Tooltip>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {archived ? "No hay eventos archivados." : "No hay eventos activos."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groupEventsByBatch(events).map((group) => {
            if (group.length === 1) {
              const event = group[0];
              return (
                <Link key={event.id} href={`/admin/eventos/${event.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <EventCardBody event={event} isViewer={isViewer} />
                  </Card>
                </Link>
              );
            }

            const batchId = group[0].batchId as string;
            const earliestStart = group.reduce((min, e) => (e.startAt < min ? e.startAt : min), group[0].startAt);
            const latestEnd = group.reduce((max, e) => (e.endAt > max ? e.endAt : max), group[0].endAt);
            return (
              <Card key={batchId} className="border-primary/30">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge>Múltiples eventos ({group.length})</Badge>
                      <p className="text-sm font-medium">{group[0].client.businessName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRange(earliestStart, latestEnd)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.map((event) => (
                      <Link key={event.id} href={`/admin/eventos/${event.id}`}>
                        <Card className="transition-colors hover:border-primary/40">
                          <EventCardBody event={event} isViewer={isViewer} />
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
