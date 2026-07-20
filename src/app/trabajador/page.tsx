/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { CalendarCheck2, Clock, Hourglass, Wallet } from "lucide-react";
import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { getWorkerDashboardStats, getUpcomingAssignmentsForWorker } from "@/services/worker-dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatRange(start: Date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(start);
}

export default async function TrabajadorDashboardPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const [stats, upcoming] = await Promise.all([
    getWorkerDashboardStats(worker.id),
    getUpcomingAssignmentsForWorker(worker.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">Tus próximas asignaciones y actividad reciente.</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Próximas asignaciones"
            value={stats.upcomingAssignments}
            icon={CalendarCheck2}
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Por confirmar" value={stats.pendingResponses} icon={Hourglass} accent="warning" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Horas este mes" value={stats.hoursThisMonth} format="decimal1" icon={Clock} accent="primary" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pagos pendientes"
            value={stats.paymentsPending}
            format="currency"
            icon={Wallet}
            accent="danger"
          />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Próximos eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes eventos próximos confirmados.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{assignment.event.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.event.address}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatRange(assignment.event.startAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
