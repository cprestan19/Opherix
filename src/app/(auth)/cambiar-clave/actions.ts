/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/tenant";
import { unstable_update } from "@/lib/auth";
import { changeOwnPassword, PasswordResetError } from "@/services/password-reset.service";
import { getPortalPathForUser } from "@/lib/portal-routing";

export interface ChangePasswordActionState {
  error?: string;
}

export async function changeOwnPasswordAction(
  _prevState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const user = await getCurrentUser();
  if (!user.companyId) {
    return { error: "No se pudo identificar tu empresa." };
  }

  try {
    await changeOwnPassword(user.companyId, user.id, password);
  } catch (error) {
    if (error instanceof PasswordResetError) return { error: error.message };
    throw error;
  }

  await unstable_update({ user: { mustChangePassword: false } });
  redirect(await getPortalPathForUser());
}
