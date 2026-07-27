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
import { deleteClientAction, restoreClientAction } from "./actions";

export function ClientDeleteAction({ clientId, deleted }: { clientId: string; deleted: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (deleted) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5"
        onClick={() =>
          startTransition(async () => {
            const result = await restoreClientAction(clientId);
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Cliente restaurado");
            router.refresh();
          })
        }
        disabled={isPending}
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ArchiveRestore className="size-3.5" />}
        Restaurar
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5 text-danger">
          <Trash2 className="size-3.5" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            Se ocultará de la lista de clientes y de las opciones al crear un evento nuevo. Su historial de
            eventos y facturación se conserva y puedes restaurarlo después desde &quot;Eliminados&quot;.
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
                const result = await deleteClientAction(clientId, reason || "No especificado");
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Cliente eliminado");
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
