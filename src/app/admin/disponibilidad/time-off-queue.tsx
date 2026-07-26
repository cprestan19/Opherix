/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { reviewTimeOffAction } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  VACATION: "Vacaciones",
  PERMIT: "Permiso",
  ABSENCE: "Ausencia",
};

interface PendingTimeOff {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  worker: { user: { name: string } };
}

export function TimeOffQueue({ items }: { items: PendingTimeOff[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay solicitudes de vacaciones/permisos pendientes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{item.worker.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {TYPE_LABELS[item.type]} · {new Intl.DateTimeFormat("es").format(item.startDate)} –{" "}
                {new Intl.DateTimeFormat("es").format(item.endDate)}
                {item.reason ? ` · ${item.reason}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-danger"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await reviewTimeOffAction(item.id, "REJECTED");
                    toast.success("Solicitud rechazada");
                  })
                }
              >
                <X className="size-4" /> Rechazar
              </Button>
              <Button
                size="sm"
                className="gap-1"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await reviewTimeOffAction(item.id, "APPROVED");
                    toast.success("Solicitud aprobada");
                  })
                }
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Aprobar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
