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
import { deleteEventAction, restoreEventAction } from "./actions";

export function EventDeleteAction({ eventId, deleted }: { eventId: string; deleted: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (deleted) {
    return (
      <Button
        type="button"
        variant="outline"
        className="gap-1.5"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await restoreEventAction(eventId);
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Evento restaurado");
            router.refresh();
          })
        }
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArchiveRestore className="size-4" />}
        Restaurar evento
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 text-danger">
          <Trash2 className="size-4" /> Eliminar evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar evento</DialogTitle>
          <DialogDescription>
            Se ocultará de Activos y Archivados. Si tiene personal propuesto/confirmado, se les notificará. Su
            historial se conserva y puedes restaurarlo después desde &quot;Eliminados&quot;.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Volver
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteEventAction(eventId, reason || "No especificado");
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Evento eliminado");
                setDialogOpen(false);
                router.push("/admin/eventos");
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
