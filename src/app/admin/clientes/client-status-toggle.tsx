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
import { Loader2, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setClientActiveAction } from "./actions";

export function ClientStatusToggle({ clientId, isActive }: { clientId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await setClientActiveAction(clientId, !isActive);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Cliente archivado" : "Cliente reactivado");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="shrink-0 gap-1.5"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isActive ? (
        <Archive className="size-3.5" />
      ) : (
        <ArchiveRestore className="size-3.5" />
      )}
      {isActive ? "Archivar" : "Reactivar"}
    </Button>
  );
}
