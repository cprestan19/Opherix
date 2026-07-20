/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckInDialog } from "./check-in-dialog";
import { checkInAction, checkOutAction } from "./actions";

interface AssignmentItem {
  id: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  event: { id: string; title: string; address: string; startAt: Date; endAt: Date };
}

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function CheckInPanel({
  assignments,
  prefillEventId,
  prefillCode,
}: {
  assignments: AssignmentItem[];
  prefillEventId?: string;
  prefillCode?: string;
}) {
  const [dialogState, setDialogState] = useState<{ assignmentId: string; mode: "in" | "out"; title: string } | null>(
    null,
  );
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  if (assignments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No tienes eventos programados para hoy.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {assignments.map((assignment) => {
          const isCheckedIn = !!assignment.checkInAt;
          const isCheckedOut = !!assignment.checkOutAt;
          const justCompleted = justCompletedId === assignment.id;
          return (
            <Card key={assignment.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{assignment.event.title}</p>
                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {justCompleted ? (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <CheckCircle2 className="size-5 text-success" />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                    {isCheckedOut ? (
                      <Badge variant="secondary">Completado</Badge>
                    ) : isCheckedIn ? (
                      <Badge>En curso</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{formatRange(assignment.event.startAt, assignment.event.endAt)}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {assignment.event.address}
                </p>
                {!isCheckedIn ? (
                  <Button
                    size="sm"
                    className="mt-2 w-fit gap-1"
                    onClick={() =>
                      setDialogState({ assignmentId: assignment.id, mode: "in", title: assignment.event.title })
                    }
                  >
                    <LogIn className="size-4" /> Registrar entrada
                  </Button>
                ) : !isCheckedOut ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-fit gap-1"
                    onClick={() =>
                      setDialogState({ assignmentId: assignment.id, mode: "out", title: assignment.event.title })
                    }
                  >
                    <LogOut className="size-4" /> Registrar salida
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {dialogState ? (
        <CheckInDialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          title={dialogState.title}
          mode={dialogState.mode}
          defaultCode={
            prefillEventId &&
            assignments.find((a) => a.id === dialogState.assignmentId)?.event.id === prefillEventId
              ? prefillCode
              : undefined
          }
          onSubmit={async (payload) => {
            const assignmentId = dialogState.assignmentId;
            const result =
              dialogState.mode === "in"
                ? await checkInAction(assignmentId, payload)
                : await checkOutAction(assignmentId, payload);
            if (!result?.error) {
              setJustCompletedId(assignmentId);
              setTimeout(() => setJustCompletedId(null), 1500);
            }
            return result;
          }}
        />
      ) : null}
    </>
  );
}
