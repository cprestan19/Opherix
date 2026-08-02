/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { AlertTriangle } from "lucide-react";
import { listCrossTenantActivity, listPlatformAuditLog } from "@/services/platform.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAuditAction, formatRelativeTime } from "@/lib/audit-labels";
import { formatDateTime12h } from "@/utils/date";

function formatTimestamp(date: Date): string {
  return formatDateTime12h(date, { dateStyle: "medium" });
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  CLIENTE: "Cliente",
  TRABAJADOR: "Trabajador",
};

export default async function ActividadPage() {
  const [activity, deletions] = await Promise.all([
    listCrossTenantActivity(),
    listPlatformAuditLog(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
        <p className="text-sm text-muted-foreground">
          Log completo, en detalle, de lo que hacen todas las empresas en Opherix.
        </p>
      </div>

      {deletions.length > 0 ? (
        <Card className="border-danger/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-danger">
              <AlertTriangle className="size-4" /> Acciones destructivas de plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Empresa eliminada</TableHead>
                  <TableHead>Ejecutado por</TableHead>
                  <TableHead>ID de empresa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletions.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatTimestamp(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{log.companyName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.actorEmail ?? "desconocido"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground/70">
                      {log.companyId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Actividad reciente por empresa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sin actividad todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{formatTimestamp(entry.createdAt)}</span>
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.company.name}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {entry.actor?.name ?? "Sistema"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.actor?.role ? (ROLE_LABELS[entry.actor.role] ?? entry.actor.role) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAuditAction(entry.action)}
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground/60">
                        ({entry.action})
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="font-mono text-xs">
                        {entry.entityType}
                        <span className="text-muted-foreground/60">/{entry.entityId}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground/70">
                      {entry.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
