/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveEventAction } from "./actions";

export function ArchiveEventAction({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveEventAction(eventId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Evento archivado correctamente");
    });
  }

  return (
    <Button variant="outline" className="gap-1.5" disabled={isPending} onClick={handleArchive}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
      Archivar evento
    </Button>
  );
}
