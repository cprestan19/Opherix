/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { getEventForAccessToken } from "@/services/event.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { EditRequestForm } from "./edit-request-form";
import { SatisfactionSurveyForm } from "./satisfaction-survey-form";

export const metadata: Metadata = {
  title: "Tu solicitud | Opherix",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Pendiente de revisión",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Rechazado",
  ARCHIVED: "Archivado",
};

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function toDatetimeLocal(date: Date) {
  return date.toISOString().slice(0, 16);
}

function InvalidLinkScreen({ message }: { message: string }) {
  return (
    <div className="min-h-svh w-full bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Enlace no disponible</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default async function EventAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string; eventId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { companySlug, eventId } = await params;
  const { token } = await searchParams;

  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();

  if (!token) return <InvalidLinkScreen message="Falta el código de acceso en el enlace." />;

  const { event, denied } = await getEventForAccessToken(company.id, eventId, token);
  if (!event) return <InvalidLinkScreen message="Este enlace no es válido." />;
  if (denied === "closed") {
    return <InvalidLinkScreen message="El administrador cerró este enlace. Contáctalo si necesitas volver a entrar." />;
  }
  if (denied === "expired") {
    return <InvalidLinkScreen message="Este enlace ya expiró." />;
  }

  const alreadyRated = event.assignments.some((a) => a.ratingScore !== null);

  return (
    <div className="min-h-svh w-full bg-secondary px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              {company.name} · {formatRange(event.startAt, event.endAt)}
            </p>
          </div>
          <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
        </div>

        {event.status === "REQUESTED" ? (
          <EditRequestForm
            companySlug={companySlug}
            eventId={eventId}
            token={token}
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
        ) : (
          <Card>
            <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Ubicación: </span>
                {event.address}
              </p>
              {event.eventType ? (
                <p>
                  <span className="text-muted-foreground">Tipo: </span>
                  {event.eventType}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2">
                <span className="text-muted-foreground">Personal solicitado: </span>
                {event.staffRequirements.map((req) => (
                  <Badge key={req.id} variant="outline">
                    {specialtyLabels[req.specialty]} x{req.quantity}
                  </Badge>
                ))}
              </div>
              {event.notes ? (
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Notas: </span>
                  {event.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        {event.status === "COMPLETED" ? (
          <SatisfactionSurveyForm
            companySlug={companySlug}
            eventId={eventId}
            token={token}
            alreadyRated={alreadyRated}
          />
        ) : null}
      </div>
    </div>
  );
}
