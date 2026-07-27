/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Star, CalendarClock, Pencil } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getWorkerDetail } from "@/repositories/worker.repository";
import { listUpcomingAssignmentsForWorker } from "@/repositories/availability.repository";
import { WorkerCv } from "@/components/shared/worker-cv";
import { WorkerExperienceCards } from "@/components/shared/worker-experience-cards";
import { WorkerAvailabilityGrid } from "@/components/shared/worker-availability-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_LABELS, WORKER_STATUS_LABELS } from "@/lib/labels";
import { WorkerStatusToggle } from "./worker-status-toggle";
import { WorkerHourlyRate } from "./worker-hourly-rate";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const companyId = await getEffectiveCompanyId();
  const [worker, currentUser] = await Promise.all([getWorkerDetail(companyId, workerId), getCurrentUser()]);

  if (!worker) notFound();

  const upcomingAssignments = await listUpcomingAssignmentsForWorker(worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{worker.user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Perfil completo del trabajador ·{" "}
            <Badge variant="secondary" className="align-middle">
              {WORKER_STATUS_LABELS[worker.status]}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkerStatusToggle workerId={worker.id} status={worker.status} />
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/admin/personal/${worker.id}/editar`}>
              <Pencil className="size-3.5" /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <WorkerCv
        worker={{
          id: worker.id,
          name: worker.user.name,
          email: worker.user.email,
          phone: worker.user.phone,
          photoUrl: worker.photoUrl,
          specialties: worker.specialties,
          experienceYears: worker.experienceYears,
          education: worker.education,
          address: worker.address,
          languages: worker.languages,
          courses: worker.courses,
          previousEmployers: worker.previousEmployers,
          licenses: worker.licenses,
          ratingAverage: worker.ratingAverage.toString(),
          ratingCount: worker.ratingCount,
        }}
      />

      {currentUser.role === "ADMIN" ? (
        <WorkerHourlyRate
          workerId={worker.id}
          hourlyRate={worker.hourlyRate ? Number(worker.hourlyRate) : null}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <CalendarClock className="size-4" /> Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worker.availabilitySlots.length === 0 && upcomingAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no ha configurado su disponibilidad.</p>
          ) : (
            <WorkerAvailabilityGrid slots={worker.availabilitySlots} upcomingAssignments={upcomingAssignments} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Star className="size-4" /> Evaluaciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worker.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tiene evaluaciones registradas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {worker.assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{assignment.event.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.ratingComment}</p>
                  </div>
                  <Badge variant="secondary">{assignment.ratingScore}/5</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FileText className="size-4" /> Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worker.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {worker.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between">
                  <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.expiresAt
                      ? `Vence ${new Intl.DateTimeFormat("es").format(doc.expiresAt)}`
                      : "Sin vencimiento"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <WorkerExperienceCards
        worker={{
          experienceYears: worker.experienceYears,
          education: worker.education,
          languages: worker.languages,
          courses: worker.courses,
          previousEmployers: worker.previousEmployers,
          licenses: worker.licenses,
        }}
      />
    </div>
  );
}
