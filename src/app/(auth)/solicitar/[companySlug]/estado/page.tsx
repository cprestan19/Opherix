/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { listEventsForClient } from "@/repositories/event.repository";
import { getClientAccessSession } from "@/lib/client-access-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { EditRequestForm } from "./edit-request-form";
import { SignOutClientSessionButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Estado de tu solicitud | Opherix",
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

const STATUS_VARIANTS: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  DRAFT: "outline",
  REQUESTED: "outline",
  CONFIRMED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  ARCHIVED: "outline",
};

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function toDatetimeLocal(date: Date) {
  return date.toISOString().slice(0, 16);
}

export default async function SolicitarEstadoPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();

  const session = await getClientAccessSession();

  if (!session || session.companyId !== company.id) {
    return (
      <div className="min-h-svh w-full bg-secondary px-4 py-10">
        <div className="mx-auto w-full max-w-lg">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Sesión no encontrada</CardTitle>
              <CardDescription>
                No encontramos una verificación activa. Vuelve a solicitar personal y confirma tu correo
                para ver el estado de tus solicitudes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/solicitar/${companySlug}`} className="text-sm font-medium text-primary hover:underline">
                Ir al formulario de solicitud
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const events = await listEventsForClient(company.id, session.clientId);

  return (
    <div className="min-h-svh w-full bg-secondary px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Tus solicitudes — {company.name}</h1>
            <p className="text-sm text-muted-foreground">{session.client.contactName} · {session.email}</p>
          </div>
          <SignOutClientSessionButton companySlug={companySlug} />
        </div>

        {events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no tienes solicitudes registradas.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
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
                  </div>
                  {event.status === "REQUESTED" ? (
                    <div className="pt-1">
                      <EditRequestForm
                        companySlug={companySlug}
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
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
