/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { Star } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listWorkers } from "@/repositories/worker.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";
import { calculateAge } from "@/utils/date";
import { WorkerFilters } from "./worker-filters";
import { RatingModerationPanel } from "./rating-moderation-panel";
import { listPendingModerations } from "@/services/rating.service";
import { asStringArray } from "@/lib/worker-fields";
import { WorkerForm } from "./worker-form";
import type { WorkerStatus } from "@/generated/prisma/enums";

const WORKER_STATUS_VALUES: WorkerStatus[] = ["ACTIVE", "APPROVED", "INACTIVE"];

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; specialty?: string; status?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const isViewer = currentUser.role === "VIEWER";
  const companyId = await getEffectiveCompanyId();
  const params = await searchParams;

  const specialty = specialtyValues.find((v) => v === params.specialty);
  const status = WORKER_STATUS_VALUES.find((v) => v === params.status);

  const [workers, pendingModerations] = await Promise.all([
    listWorkers(companyId, { search: params.search, specialty, status }),
    isViewer ? Promise.resolve([]) : listPendingModerations(companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {isViewer ? null : <RatingModerationPanel items={pendingModerations} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal</h1>
          <p className="text-sm text-muted-foreground">{workers.length} trabajador(es) en el directorio.</p>
        </div>
        {isViewer ? null : <WorkerForm />}
      </div>

      <WorkerFilters />

      {workers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron trabajadores con estos filtros.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {workers.map((worker) => {
              const languages = asStringArray(worker.languages);
              const age = calculateAge(worker.birthDate);
              return (
                <li key={worker.id}>
                  <Link
                    href={`/admin/personal/${worker.id}`}
                    className="flex items-center gap-3 py-2 pr-3.5 pl-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-2.5 sm:pr-4"
                  >
                    <Avatar className="size-16 shrink-0 shadow-sm ring-2 ring-background sm:size-18">
                      <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.user.name} />
                      <AvatarFallback className="text-base">{worker.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      {worker.status === "ACTIVE" ? (
                        <AvatarBadge className="bg-success" title="Activo" />
                      ) : null}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{worker.user.name}</p>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3.5 fill-warning text-warning" />
                          {Number(worker.ratingAverage).toFixed(1)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {age ? `${age} años · ` : ""}
                        {worker.experienceYears ?? 0} años de experiencia
                        {languages.length > 0 ? ` · ${languages.join(", ")}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {worker.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialtyLabels[specialty]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
