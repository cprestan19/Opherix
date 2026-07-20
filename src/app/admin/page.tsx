/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import {
  CalendarDays,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Wallet,
  Clock,
  HandCoins,
  Activity,
} from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import {
  getAdminDashboardStats,
  getUpcomingEvents,
  getAssignmentsByWeek,
  getEventTypeDistribution,
  getRecentActivity,
} from "@/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentsLineChart } from "@/components/shared/charts/assignments-line-chart";
import { EventTypeDonutChart } from "@/components/shared/charts/event-type-donut-chart";
import { formatAuditAction, formatRelativeTime } from "@/lib/audit-labels";

function formatDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export default async function AdminDashboardPage() {
  const companyId = await getEffectiveCompanyId();
  const [stats, upcomingEvents, assignmentsByWeek, eventTypeDistribution, recentActivity] = await Promise.all([
    getAdminDashboardStats(companyId),
    getUpcomingEvents(companyId),
    getAssignmentsByWeek(companyId),
    getEventTypeDistribution(companyId),
    getRecentActivity(companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la operación de hoy.</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Eventos hoy"
            value={stats.eventsToday}
            icon={CalendarDays}
            accent="primary"
            href="/admin/eventos"
            linkLabel="Ver eventos"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Personal disponible"
            value={stats.workersAvailableToday}
            icon={Users}
            accent="success"
            href="/admin/personal"
            linkLabel="Ver personal"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Personal trabajando"
            value={stats.workersWorkingNow}
            icon={UserCheck}
            accent="indigo"
            href="/admin/check-in"
            linkLabel="Ver check-in"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Solicitudes pendientes"
            value={stats.pendingApplications}
            icon={UserPlus}
            accent="warning"
            href="/admin/reclutamiento"
            linkLabel="Ver solicitudes"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Clientes activos"
            value={stats.activeClients}
            icon={Building2}
            accent="primary"
            href="/admin/clientes"
            linkLabel="Ver clientes"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Facturación del mes"
            value={stats.billingThisMonth}
            format="currency"
            icon={Wallet}
            accent="success"
            href="/admin/pagos"
            linkLabel="Ver pagos"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Horas trabajadas (mes)"
            value={stats.hoursWorkedThisMonth}
            format="decimal1"
            icon={Clock}
            accent="indigo"
            href="/admin/reportes"
            linkLabel="Ver reportes"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pagos pendientes"
            value={stats.paymentsPending}
            format="currency"
            icon={HandCoins}
            accent="danger"
            href="/admin/pagos"
            linkLabel="Ver pagos"
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Asignaciones por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentsLineChart data={assignmentsByWeek} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Distribución por tipo de evento</CardTitle>
          </CardHeader>
          <CardContent>
            {eventTypeDistribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin eventos todavía.</p>
            ) : (
              <EventTypeDonutChart data={eventTypeDistribution} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos próximos programados.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {event.client.businessName} · {formatDateRange(event.startAt, event.endAt)}
                      </p>
                    </div>
                    <Badge variant="outline">{event.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Activity className="size-4" /> Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{entry.actorName}</span>{" "}
                      {formatAuditAction(entry.action)}
                      <span className="ml-2 text-xs text-muted-foreground/70">
                        {formatRelativeTime(entry.createdAt)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
