/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FinancialReportRow } from "@/services/financial-report.service";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export function FinancialReportTable({ rows }: { rows: FinancialReportRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay eventos que coincidan con estos filtros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Personal</TableHead>
            <TableHead>Ingreso</TableHead>
            <TableHead>Egreso</TableHead>
            <TableHead>Margen</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.eventId}>
              <TableCell className="whitespace-nowrap">{dateFormatter.format(row.startAt)}</TableCell>
              <TableCell>
                <Link href={`/admin/clientes/${row.clientId}`} className="hover:underline">
                  {row.clientName}
                </Link>
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/admin/eventos/${row.eventId}`} className="hover:underline">
                  {row.title}
                </Link>
              </TableCell>
              <TableCell>{row.staffCount}</TableCell>
              <TableCell className="text-success">{row.ingreso > 0 ? currency(row.ingreso) : "—"}</TableCell>
              <TableCell className="text-danger">{row.egreso > 0 ? currency(row.egreso) : "—"}</TableCell>
              <TableCell className={row.margen >= 0 ? "font-medium text-foreground" : "font-medium text-danger"}>
                {currency(row.margen)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{STATUS_LABELS[row.status] ?? row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
