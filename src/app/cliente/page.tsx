/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { CalendarClock, ListChecks, Receipt, Wallet } from "lucide-react";
import { getCurrentUser, getEffectiveCompanyId } from "@/lib/tenant";
import { getClientDashboardStats, getRecentEventsForClient } from "@/services/client-dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default async function ClienteDashboardPage() {
  const user = await getCurrentUser();

  if (!user.clientId) {
    return <p className="text-sm text-muted-foreground">Tu usuario no está vinculado a una cuenta cliente.</p>;
  }

  const companyId = await getEffectiveCompanyId();
  const [stats, recentEvents] = await Promise.all([
    getClientDashboardStats(companyId, user.clientId),
    getRecentEventsForClient(companyId, user.clientId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">Resumen de tus eventos y facturación.</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard label="Próximos eventos" value={stats.upcomingEvents} icon={CalendarClock} accent="primary" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Solicitudes activas" value={stats.activeRequests} icon={ListChecks} accent="warning" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Facturas pendientes"
            value={stats.invoicesPending}
            format="currency"
            icon={Receipt}
            accent="danger"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Total pagado" value={stats.totalSpent} format="currency" icon={Wallet} accent="success" />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Eventos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has solicitado eventos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="font-medium">{event.title}</p>
                  <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
