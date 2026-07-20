/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Clock, CalendarX2, Timer, UserX } from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import {
  getHoursWorkedByWeek,
  getTopWorkers,
  getEventStatusSummary,
  getPunctualitySummary,
  getAbsenceSummary,
} from "@/services/reports.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { WeeklyHoursChart } from "@/components/shared/charts/weekly-hours-chart";
import { TopWorkersChart } from "@/components/shared/charts/top-workers-chart";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Solicitados",
  CONFIRMED: "Confirmados",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completados",
  CANCELLED: "Cancelados",
};

export default async function ReportesPage() {
  const companyId = await getEffectiveCompanyId();
  const [hoursByWeek, topWorkers, eventStatus, punctuality, absences] = await Promise.all([
    getHoursWorkedByWeek(companyId),
    getTopWorkers(companyId),
    getEventStatusSummary(companyId),
    getPunctualitySummary(companyId),
    getAbsenceSummary(companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">Horas, eventos, puntualidad y ranking de trabajadores.</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Puntualidad (a tiempo)"
            value={punctuality.onTimeRate}
            format="percentage"
            icon={Timer}
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Promedio de retraso"
            value={punctuality.averageMinutesLate}
            suffix="min"
            icon={Clock}
            accent={punctuality.averageMinutesLate > 10 ? "warning" : "primary"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Ausencias aprobadas" value={absences.absences} icon={CalendarX2} accent="warning" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Asignaciones rechazadas"
            value={absences.rejectedAssignments}
            icon={UserX}
            accent="danger"
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Horas trabajadas por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyHoursChart data={hoursByWeek} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Trabajadores más solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            {topWorkers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <TopWorkersChart data={topWorkers} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Eventos por estado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          {eventStatus.map((s) => (
            <div key={s.status} className="flex flex-col">
              <span className="text-2xl font-semibold tracking-tight">{s.count}</span>
              <span className="text-sm text-muted-foreground">{STATUS_LABELS[s.status]}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
