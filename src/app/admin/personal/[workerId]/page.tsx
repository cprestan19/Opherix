/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import { FileText, Star, CalendarClock } from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { getWorkerDetail } from "@/repositories/worker.repository";
import { WorkerCv } from "@/components/shared/worker-cv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WEEKDAY_LABELS } from "@/utils/date";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ID_CARD: "Cédula",
  RESUME: "Currículum",
  HEALTH_CARD: "Carnet de salud",
  FOOD_HANDLING: "Manipulación de alimentos",
  LICENSE: "Licencia",
  CERTIFICATE: "Certificado",
  OTHER: "Otro",
};

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const companyId = await getEffectiveCompanyId();
  const worker = await getWorkerDetail(companyId, workerId);

  if (!worker) notFound();

  const slotsByDay = new Map<number, string[]>();
  for (const slot of worker.availabilitySlots) {
    const list = slotsByDay.get(slot.dayOfWeek) ?? [];
    list.push(`${slot.startTime}–${slot.endTime}`);
    slotsByDay.set(slot.dayOfWeek, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{worker.user.name}</h1>
        <p className="text-sm text-muted-foreground">Perfil completo del trabajador.</p>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <CalendarClock className="size-4" /> Disponibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slotsByDay.size === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no ha configurado su disponibilidad.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {WEEKDAY_LABELS.map((label, day) =>
                  slotsByDay.has(day) ? (
                    <li key={day} className="flex justify-between">
                      <span>{label}</span>
                      <span className="text-muted-foreground">{slotsByDay.get(day)!.join(", ")}</span>
                    </li>
                  ) : null,
                )}
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
      </div>

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
    </div>
  );
}
