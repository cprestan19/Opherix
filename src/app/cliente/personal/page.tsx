/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Star, Languages } from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { listWorkers } from "@/repositories/worker.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";
import { WorkerFiltersClient } from "./worker-filters-client";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function ClientePersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; specialty?: string }>;
}) {
  const companyId = await getEffectiveCompanyId();
  const params = await searchParams;
  const specialty = specialtyValues.find((v) => v === params.specialty);

  const workers = await listWorkers(companyId, {
    search: params.search,
    specialty,
    status: "ACTIVE",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buscar personal</h1>
        <p className="text-sm text-muted-foreground">
          Conoce a nuestro personal disponible. Al solicitar un evento, el administrador asigna al equipo ideal.
        </p>
      </div>

      <WorkerFiltersClient />

      {workers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontró personal con estos filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => {
            const languages = asStringArray(worker.languages);
            return (
              <Card key={worker.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.user.name} />
                      <AvatarFallback>{worker.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{worker.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {worker.experienceYears ?? 0} años de experiencia
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {worker.specialties.map((specialty) => (
                      <Badge key={specialty}>{specialtyLabels[specialty]}</Badge>
                    ))}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3.5 fill-warning text-warning" />
                      {Number(worker.ratingAverage).toFixed(1)}
                    </span>
                  </div>
                  {languages.length > 0 ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Languages className="size-3.5" /> {languages.join(", ")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
