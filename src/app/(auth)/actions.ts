/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { getPortalPath } from "@/lib/portal-routing";
import { prisma } from "@/lib/prisma";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export interface LoginActionState {
  error?: string;
}

export async function signInAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const identifier = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email: identifier,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error;
  }

  // No se reutiliza auth() aquí: la cookie de sesión recién emitida por
  // signIn() no es visible de forma confiable dentro de la misma invocación
  // de la server action, así que el rol se resuelve directo desde la BD.
  // "email" en el form puede ser un correo real o un username (§ /admin/personal
  // "Dar acceso al portal") — mismo OR que auth.ts's authorize().
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    include: { worker: { select: { status: true } } },
  });

  if (user) {
    redirect(getPortalPath(user.role, user.worker?.status, user.mustChangePassword));
  }

  // Sin match en User (tenant) — debe ser un admin de plataforma.
  redirect(getPortalPath("PLATFORM_ADMIN"));
}
