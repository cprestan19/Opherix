/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Building2, CheckCircle2, Users, CalendarDays } from "lucide-react";
import { getPlatformStats, listCompanies } from "@/services/platform.service";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlatformDashboardPage() {
  const [stats, companies] = await Promise.all([getPlatformStats(), listCompanies()]);
  const recentCompanies = companies.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard de plataforma</h1>
        <p className="text-sm text-muted-foreground">Resumen de todas las empresas que usan Operix.</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Empresas totales"
            value={stats.totalCompanies}
            icon={Building2}
            accent="primary"
            href="/platform/empresas"
            linkLabel="Ver empresas"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Empresas activas" value={stats.activeCompanies} icon={CheckCircle2} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Trabajadores (todas)" value={stats.totalWorkers} icon={Users} accent="indigo" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Eventos (todos)" value={stats.totalEvents} icon={CalendarDays} accent="warning" />
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Empresas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay empresas registradas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentCompanies.map((company) => (
                <li key={company.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.country} · {company._count.workers} trabajadores · {company._count.clients} clientes
                    </p>
                  </div>
                  <Badge variant={company.isActive ? "secondary" : "outline"}>
                    {company.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
