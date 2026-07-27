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
import { Loader2, Trash2, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { deleteWorkerAction, restoreWorkerAction } from "./actions";

export function WorkerDeleteAction({
  workerId,
  deleted,
  compact = false,
}: {
  workerId: string;
  deleted: boolean;
  /** Botón solo-ícono para usarlo dentro de filas de lista (ej. /admin/personal). */
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (deleted) {
    return (
      <Button
        type="button"
        size={compact ? "icon" : "sm"}
        variant="outline"
        className={compact ? "shrink-0" : "gap-1.5"}
        disabled={isPending}
        aria-label={compact ? "Restaurar" : undefined}
        onClick={() =>
          startTransition(async () => {
            const result = await restoreWorkerAction(workerId);
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Trabajador restaurado");
            router.refresh();
          })
        }
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ArchiveRestore className="size-3.5" />}
        {compact ? null : "Restaurar"}
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size={compact ? "icon" : "sm"}
          variant="outline"
          className={compact ? "shrink-0 text-danger" : "gap-1.5 text-danger"}
          aria-label={compact ? "Eliminar" : undefined}
        >
          <Trash2 className="size-3.5" />
          {compact ? null : "Eliminar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar trabajador</DialogTitle>
          <DialogDescription>
            Se ocultará del directorio y perderá acceso a su portal. Su historial (pagos, evaluaciones,
            documentos) se conserva y puedes restaurarlo después desde &quot;Eliminados&quot;.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteWorkerAction(workerId, reason || "No especificado");
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Trabajador eliminado");
                setDialogOpen(false);
                router.refresh();
              })
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmar eliminación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
