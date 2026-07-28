/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { markAsPaidAction, adjustPaymentAction } from "./actions";

interface PaymentRecordRow {
  id: string;
  worker: { user: { name: string } };
  eventTitle: string | null;
  assignmentCount: number;
  bonuses: string;
  deductions: string;
  totalAmount: string;
  status: string;
}

function currency(value: string) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(value));
}

export function PaymentTable({ records }: { records: PaymentRecordRow[] }) {
  if (records.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No hay pagos calculados para este periodo.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trabajador</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Asignaciones</TableHead>
          <TableHead>Bonos/Desc.</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <PaymentRow key={record.id} record={record} />
        ))}
      </TableBody>
    </Table>
  );
}

function PaymentRow({ record }: { record: PaymentRecordRow }) {
  const [payOpen, setPayOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [method, setMethod] = useState("Efectivo");
  const [bonuses, setBonuses] = useState(record.bonuses);
  const [deductions, setDeductions] = useState(record.deductions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleMarkPaid() {
    setIsSubmitting(true);
    await markAsPaidAction(record.id, method);
    setIsSubmitting(false);
    toast.success("Pago marcado como pagado");
    setPayOpen(false);
  }

  async function handleAdjust() {
    setIsSubmitting(true);
    await adjustPaymentAction(record.id, Number(bonuses), Number(deductions));
    setIsSubmitting(false);
    toast.success("Bonos/descuentos ajustados correctamente");
    setAdjustOpen(false);
  }

  return (
    <TableRow>
      <TableCell>{record.worker.user.name}</TableCell>
      <TableCell className="text-muted-foreground">{record.eventTitle ?? "—"}</TableCell>
      <TableCell>{record.assignmentCount}</TableCell>
      <TableCell>
        +{currency(record.bonuses)} / -{currency(record.deductions)}
      </TableCell>
      <TableCell className="font-medium">{currency(record.totalAmount)}</TableCell>
      <TableCell>
        <Badge variant={record.status === "PAGADO" ? "secondary" : "outline"}>{record.status}</Badge>
      </TableCell>
      <TableCell className="flex gap-1">
        {record.status === "PENDIENTE" ? (
          <>
            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Ajustar bonos y descuentos">
                  <Pencil className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajustar bonos/descuentos</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Bonos</label>
                    <Input type="number" value={bonuses} onChange={(e) => setBonuses(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Descuentos</label>
                    <Input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAdjust} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Marcar pagado</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Marcar como pagado</DialogTitle>
                </DialogHeader>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button onClick={handleMarkPaid} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
