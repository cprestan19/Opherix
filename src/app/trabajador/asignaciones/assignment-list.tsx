/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { Loader2, Check, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { respondToAssignmentAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Pendiente de confirmar",
  ACCEPTED: "Confirmada",
  REJECTED: "Rechazada",
  COMPLETED: "Completada",
};

const STATUS_VARIANTS: Record<string, "outline" | "secondary" | "destructive"> = {
  PROPOSED: "outline",
  ACCEPTED: "secondary",
  REJECTED: "destructive",
  COMPLETED: "secondary",
};

interface AssignmentItem {
  id: string;
  status: string;
  event: {
    title: string;
    address: string;
    startAt: Date;
    endAt: Date;
    client: { businessName: string };
  };
}

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function AssignmentList({ assignments }: { assignments: AssignmentItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (assignments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No tienes asignaciones por ahora.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium">{assignment.event.title}</p>
              <Badge variant={STATUS_VARIANTS[assignment.status]}>{STATUS_LABELS[assignment.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {assignment.event.client.businessName} · {formatRange(assignment.event.startAt, assignment.event.endAt)}
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {assignment.event.address}
            </p>
            {assignment.status === "PROPOSED" ? (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-danger"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await respondToAssignmentAction(assignment.id, "REJECTED");
                      toast.success("Asignación rechazada");
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
                      await respondToAssignmentAction(assignment.id, "ACCEPTED");
                      toast.success("Asignación aceptada");
                    })
                  }
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Aceptar
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
