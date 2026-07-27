/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { approveApplicationAction, rejectApplicationAction } from "@/app/admin/reclutamiento/actions";

/**
 * Aprobar/rechazar directo desde el perfil completo — para que el
 * administrador revise toda la información de la postulación (datos
 * personales, experiencia, documentos) antes de decidir, en vez de solo
 * ver la tarjeta resumida en /admin/reclutamiento.
 */
export function ApplicationDecisionPanel({ workerId, workerName }: { workerId: string; workerName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      await approveApplicationAction(workerId);
      toast.success(`${workerName} fue aprobado`);
      router.push("/admin/reclutamiento");
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectApplicationAction(workerId, rejectReason || "No especificado");
      toast.success(`Postulación de ${workerName} rechazada`);
      setDialogOpen(false);
      router.push("/admin/reclutamiento");
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Postulación pendiente de revisión</p>
            <p className="text-xs text-muted-foreground">
              Revisa toda la información de esta página antes de aprobar o rechazar.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-danger" disabled={isPending}>
                <X className="size-4" /> Rechazar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar postulación</DialogTitle>
                <DialogDescription>Indica el motivo. {workerName} podrá verlo en su portal.</DialogDescription>
              </DialogHeader>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo"
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirmar rechazo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-1" onClick={handleApprove} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Aprobar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
