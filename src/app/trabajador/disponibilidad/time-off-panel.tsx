/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestTimeOffAction } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  VACATION: "Vacaciones",
  PERMIT: "Permiso",
  ABSENCE: "Ausencia",
};

const STATUS_VARIANTS: Record<string, "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  REJECTED: "destructive",
};

interface TimeOffItem {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  reason: string | null;
}

interface FormValues {
  type: "VACATION" | "PERMIT" | "ABSENCE";
  startDate: string;
  endDate: string;
  reason: string;
}

export function TimeOffPanel({ items }: { items: TimeOffItem[] }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { type: "VACATION", startDate: "", endDate: "", reason: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await requestTimeOffAction(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    reset();
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium">Vacaciones y permisos</CardTitle>
          <CardDescription>Solicita ausencias y da seguimiento a su aprobación.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="size-4" /> Nueva solicitud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Nueva solicitud</DialogTitle>
                <DialogDescription>El administrador revisará tu solicitud.</DialogDescription>
              </DialogHeader>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACATION">Vacaciones</SelectItem>
                      <SelectItem value="PERMIT">Permiso</SelectItem>
                      <SelectItem value="ABSENCE">Ausencia</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" {...register("startDate", { required: true })} />
                <Input type="date" {...register("endDate", { required: true })} />
              </div>
              <Textarea placeholder="Motivo (opcional)" rows={2} {...register("reason")} />
              {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Enviar solicitud
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes solicitudes registradas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{TYPE_LABELS[item.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es").format(item.startDate)} –{" "}
                    {new Intl.DateTimeFormat("es").format(item.endDate)}
                    {item.reason ? ` · ${item.reason}` : ""}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
