/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { archiveEventAction } from "./[eventId]/actions";

/**
 * Botón de archivar desde la lista de eventos (§ /admin/eventos), a
 * diferencia de ArchiveEventAction (detalle del evento) — mismo server
 * action, sin diálogo de confirmación: archiva de una vez y avisa por toast
 * lo que está haciendo, igual que el resto de acciones rápidas del admin.
 * La tarjeta entera es un <Link> al detalle, así que el click debe frenar la
 * navegación (preventDefault + stopPropagation) antes de disparar la acción.
 */
export function ArchiveEventQuickAction({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const toastId = toast.loading("Archivando evento…");
    startTransition(async () => {
      const result = await archiveEventAction(eventId);
      if (result?.error) {
        toast.error(result.error, { id: toastId });
        return;
      }
      toast.success("Evento archivado", { id: toastId });
      router.refresh();
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isPending}
            onClick={handleArchive}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Archive />}
            <span className="sr-only">Archivar evento</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Archiva el evento sin importar su estado actual — lo saca de la lista de activos.</TooltipContent>
    </Tooltip>
  );
}
