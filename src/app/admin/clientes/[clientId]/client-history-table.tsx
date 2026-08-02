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
import { formatTime12h } from "@/utils/date";

export interface ClientHistoryRow {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: string;
  staffCount: number;
  totalCharged: number | null;
  invoiceStatus: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Archivado",
};

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export function ClientHistoryTable({ rows }: { rows: ClientHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Este cliente aún no tiene eventos.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Hora inicio</TableHead>
          <TableHead>Hora final</TableHead>
          <TableHead>Cantidad de personal</TableHead>
          <TableHead>Total {rows.some((r) => r.invoiceStatus === "PAID") ? "cobrado" : "a cobrar"}</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link href={`/admin/eventos/${row.id}`} className="hover:underline">
                {row.title}
              </Link>
            </TableCell>
            <TableCell>{dateFormatter.format(row.startAt)}</TableCell>
            <TableCell>{formatTime12h(row.startAt)}</TableCell>
            <TableCell>{formatTime12h(row.endAt)}</TableCell>
            <TableCell>{row.staffCount}</TableCell>
            <TableCell>{row.totalCharged !== null ? currency(row.totalCharged) : "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{STATUS_LABELS[row.status] ?? row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
