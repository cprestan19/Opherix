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
import { Loader2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setWorkerStatusAction } from "./actions";
import type { WorkerStatus } from "@/generated/prisma/enums";

export function WorkerStatusToggle({ workerId, status }: { workerId: string; status: WorkerStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "APPROVED") return null;

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const result = await setWorkerStatusAction(workerId, nextStatus);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(nextStatus === "ACTIVE" ? "Trabajador activado" : "Trabajador suspendido");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={isPending}
        onClick={handleToggle}
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : status === "ACTIVE" ? (
          <PowerOff className="size-3.5" />
        ) : (
          <Power className="size-3.5" />
        )}
        {status === "ACTIVE" ? "Suspender" : "Activar"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
