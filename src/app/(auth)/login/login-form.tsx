/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { signInAction, type LoginActionState } from "../actions";

const initialState: LoginActionState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo o usuario</Label>
        <Input id="email" name="email" type="text" autoComplete="username" required placeholder="tu@empresa.com" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/forgot-password" className="text-xs text-primary underline underline-offset-4">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Iniciar sesión
      </Button>
    </form>
  );
}
