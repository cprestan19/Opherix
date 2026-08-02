/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, FileText, Mail, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import {
  setEventAmountAction,
  markInvoicePaidAction,
  sendInvoiceByEmailAction,
  getInvoiceWhatsAppLinkAction,
  deleteInvoiceAction,
} from "./actions";

export interface ClientPaymentRow {
  eventId: string;
  eventTitle: string;
  clientName: string;
  startAt: Date;
  invoice: { id: string; amount: string; status: "ISSUED" | "PAID"; paidAt: Date | null } | null;
}

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export function ClientPaymentsTable({ rows }: { rows: ClientPaymentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay eventos confirmados en este periodo.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Factura</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ClientPaymentRowItem key={row.eventId} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}

function ClientPaymentRowItem({ row }: { row: ClientPaymentRow }) {
  const [amount, setAmount] = useState(row.invoice?.amount ?? "");
  const [isSavingAmount, setIsSavingAmount] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isPaid = row.invoice?.status === "PAID";

  async function handleSaveAmount() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    setIsSavingAmount(true);
    const result = await setEventAmountAction(row.eventId, parsed);
    setIsSavingAmount(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Monto guardado");
  }

  async function handleMarkCancelled() {
    if (!row.invoice) return;
    setIsCancelling(true);
    const result = await markInvoicePaidAction(row.invoice.id, row.eventId);
    setIsCancelling(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cobro marcado como cancelado — se registró como ingreso");
  }

  async function handleSendEmail() {
    if (!row.invoice) return;
    setIsSendingEmail(true);
    const result = await sendInvoiceByEmailAction(row.invoice.id);
    setIsSendingEmail(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Comprobante enviado por correo");
  }

  async function handleSendWhatsApp() {
    if (!row.invoice) return;
    setIsSendingWhatsApp(true);
    const result = await getInvoiceWhatsAppLinkAction(row.invoice.id);
    setIsSendingWhatsApp(false);
    if (result?.error || !result.url) {
      toast.error(result.error ?? "No se pudo generar el enlace.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!row.invoice) return;
    setIsDeleting(true);
    const result = await deleteInvoiceAction(row.invoice.id, row.eventId);
    setIsDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cobro eliminado");
    setDeleteOpen(false);
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{row.eventTitle}</TableCell>
      <TableCell>{row.clientName}</TableCell>
      <TableCell>{dateFormatter.format(row.startAt)}</TableCell>
      <TableCell>
        {isPaid ? (
          <span className="font-medium">{currency(Number(row.invoice?.amount))}</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28"
            />
            <Button size="sm" variant="outline" disabled={isSavingAmount} onClick={handleSaveAmount}>
              {isSavingAmount ? <Loader2 className="size-3.5 animate-spin" /> : "Guardar"}
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={isPaid ? "secondary" : row.invoice ? "outline" : "outline"}>
          {isPaid ? "Cancelado" : row.invoice ? "Pendiente de cobro" : "Sin monto"}
        </Badge>
      </TableCell>
      <TableCell>
        {row.invoice ? (
          <div className="flex items-center gap-1">
            <Button asChild size="icon" variant="ghost" aria-label="Ver/descargar PDF">
              <a href={`/api/pagos/invoices/${row.invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <FileText className="size-3.5" />
              </a>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Enviar por correo"
              disabled={isSendingEmail}
              onClick={handleSendEmail}
            >
              {isSendingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Enviar por WhatsApp"
              disabled={isSendingWhatsApp}
              onClick={handleSendWhatsApp}
            >
              {isSendingWhatsApp ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MessageCircle className="size-3.5" />
              )}
            </Button>
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        {row.invoice && !isPaid ? (
          <div className="flex items-center gap-1">
            <Button size="sm" className="gap-1.5" disabled={isCancelling} onClick={handleMarkCancelled}>
              {isCancelling ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Cancelado
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-danger" aria-label="Eliminar cobro">
                  <Trash2 className="size-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar cobro</DialogTitle>
                  <DialogDescription>
                    Se elimina por completo este cobro pendiente al cliente — no se puede deshacer. No afecta cobros
                    ya marcados como cancelados/pagados.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Volver
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
