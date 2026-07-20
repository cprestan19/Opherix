/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { requestPasswordReset } from "@/services/password-reset.service";

export interface ForgotPasswordActionState {
  message?: string;
  error?: string;
}

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Ingresa un correo válido." };
  }

  const { message } = await requestPasswordReset(email);
  return { message };
}
