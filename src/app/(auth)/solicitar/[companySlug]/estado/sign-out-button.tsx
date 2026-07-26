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
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutClientSessionAction } from "./actions";

export function SignOutClientSessionButton({ companySlug }: { companySlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutClientSessionAction();
      router.push(`/solicitar/${companySlug}`);
    });
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1.5" disabled={isPending} onClick={handleSignOut}>
      <LogOut className="size-3.5" /> Salir
    </Button>
  );
}
