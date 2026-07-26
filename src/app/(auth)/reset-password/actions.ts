/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { confirmPasswordReset, PasswordResetError } from "@/services/password-reset.service";

export interface ResetPasswordActionState {
  success?: boolean;
  error?: string;
}

export async function confirmPasswordResetAction(
  _prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Enlace inválido — pide uno nuevo desde '¿Olvidaste tu contraseña?'." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    await confirmPasswordReset(token, password);
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return { error: error.message };
    }
    throw error;
  }

  return { success: true };
}
