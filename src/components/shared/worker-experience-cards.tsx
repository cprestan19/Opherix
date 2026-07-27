/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Briefcase, GraduationCap, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { languageLabels } from "@/lib/validations/worker-application";
import { asStringArray, asEmployers } from "@/lib/worker-fields";

function languageLabel(value: string): string {
  return (languageLabels as Record<string, string>)[value] ?? value;
}

export interface WorkerExperienceData {
  experienceYears: number | null;
  education: string | null;
  languages: unknown;
  courses: unknown;
  previousEmployers: unknown;
  licenses: unknown;
}

/** Bloques de Experiencia y Formación — separados de WorkerCv para poder ubicarlos en cualquier parte de la página. */
export function WorkerExperienceCards({ worker }: { worker: WorkerExperienceData }) {
  const languages = asStringArray(worker.languages);
  const courses = asStringArray(worker.courses);
  const licenses = asStringArray(worker.licenses);
  const employers = asEmployers(worker.previousEmployers);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Briefcase className="size-4" /> Experiencia
          </h3>
          <p className="text-sm text-muted-foreground">
            {worker.experienceYears ?? 0} año(s) de experiencia en eventos
          </p>
          {employers.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {employers.map((employer, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-foreground">{employer.role}</span>
                  <span className="text-muted-foreground"> — {employer.company}</span>
                  <div className="text-xs text-muted-foreground">
                    {employer.from} – {employer.to || "presente"}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <GraduationCap className="size-4" /> Formación
            </h3>
            <p className="text-sm text-muted-foreground">{worker.education}</p>
            {courses.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {courses.map((course) => (
                  <Badge key={course} variant="outline">
                    {course}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Languages className="size-4" /> Idiomas
            </h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {languages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {languageLabel(lang)}
                </Badge>
              ))}
            </div>
          </div>
          {licenses.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">Licencias y certificaciones</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {licenses.map((license) => (
                  <Badge key={license} variant="outline">
                    {license}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
