/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
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
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { worker: { select: { status: true } } },
  });

  if (user) {
    redirect(getPortalPath(user.role, user.worker?.status));
  }

  // Sin match en User (tenant) — debe ser un admin de plataforma.
  redirect(getPortalPath("PLATFORM_ADMIN"));
}
