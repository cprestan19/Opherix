/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { assignWorkerAction, removeAssignmentAction } from "./actions";
import type { Specialty } from "@/generated/prisma/enums";

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Propuesta",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

const ASSIGNMENT_STATUS_VARIANTS: Record<string, "outline" | "secondary" | "destructive"> = {
  PROPOSED: "outline",
  ACCEPTED: "secondary",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};

interface Requirement {
  id: string;
  specialty: string;
  quantity: number;
}

interface Assignment {
  id: string;
  status: string;
  worker: { id: string; user: { name: string; phone: string | null } };
}

interface AvailableWorker {
  id: string;
  user: { name: string };
}

interface AssignmentPanelProps {
  eventId: string;
  requirements: Requirement[];
  assignments: Assignment[];
  availableWorkersBySpecialty: Record<string, AvailableWorker[]>;
  readOnly?: boolean;
}

export function AssignmentPanel({
  eventId,
  requirements,
  assignments,
  availableWorkersBySpecialty,
  readOnly = false,
}: AssignmentPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const activeAssignments = assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED");

  function handleAssign(requirementId: string, specialty: string) {
    const workerId = selected[requirementId];
    if (!workerId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignWorkerAction(eventId, workerId, specialty as Specialty);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Trabajador asignado correctamente");
    });
  }

  function handleRemove(assignmentId: string) {
    startTransition(async () => {
      await removeAssignmentAction(eventId, assignmentId);
      toast.success("Asignación eliminada");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Personal requerido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {requirements.map((req) => {
            const assignedCount = activeAssignments.length; // aproximado; se refina en Fase 11 con desglose por especialidad
            const workers = availableWorkersBySpecialty[req.specialty] ?? [];
            return (
              <div key={req.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge>{specialtyLabels[req.specialty as keyof typeof specialtyLabels]}</Badge>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Requiere {req.quantity} · {assignedCount} asignado(s) en total al evento
                  </span>
                </div>
                {readOnly ? null : (
                  <div className="flex gap-2">
                    <Select
                      value={selected[req.id] ?? ""}
                      onValueChange={(value) => setSelected((prev) => ({ ...prev, [req.id]: value }))}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Seleccionar trabajador" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">Sin trabajadores disponibles</div>
                        ) : (
                          workers.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!selected[req.id] || isPending}
                      onClick={() => handleAssign(req.id, req.specialty)}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Asignar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay personal asignado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeAssignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {assignment.worker.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{assignment.worker.user.name}</p>
                      <p className="text-xs text-muted-foreground">{assignment.worker.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ASSIGNMENT_STATUS_VARIANTS[assignment.status]}>
                      {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                    </Badge>
                    {readOnly ? null : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar asignación"
                        disabled={isPending}
                        onClick={() => handleRemove(assignment.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
