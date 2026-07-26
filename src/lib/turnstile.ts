/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";

// Igual que Google en auth.ts (isGoogleConfigured): sin las keys reales de
// Cloudflare, el formulario público funciona sin captcha — se activa solo en
// cuanto TURNSTILE_SECRET_KEY exista en el entorno.
export const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstileToken(token: string | undefined, ip?: string): Promise<boolean> {
  if (!isTurnstileConfigured) return true;
  if (!token) return false;

  const formData = new URLSearchParams();
  formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[turnstile] Error verificando token:", error);
    return false;
  }
}
