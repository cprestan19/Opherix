/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import bcrypt from "bcryptjs";
import * as repo from "@/repositories/password-reset.repository";
import { generatePasswordResetToken, hashPasswordResetToken } from "@/lib/password-reset-token";
import { sendEmail } from "@/lib/notifications/email";
import { logAudit } from "@/lib/audit";

export class PasswordResetError extends Error {}

const GENERIC_REQUEST_MESSAGE =
  "Si el correo existe en Operix, vas a recibir un enlace para restablecer tu contraseña.";

/**
 * Genera y "envía" (o, si no hay SMTP configurado, deja en el log del
 * servidor — solo fuera de producción) un enlace de un solo uso para
 * restablecer contraseña. Responde siempre con el mismo mensaje genérico,
 * exista o no la cuenta, para no filtrar qué correos están registrados.
 */
export async function requestPasswordReset(emailRaw: string): Promise<{ message: string }> {
  const email = emailRaw.trim().toLowerCase();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const user = await repo.findUserByEmail(email);
  const platformAdmin = user ? null : await repo.findPlatformAdminByEmail(email);

  if (!user && !platformAdmin) {
    return { message: GENERIC_REQUEST_MESSAGE };
  }

  const { token, tokenHash, expiresAt } = generatePasswordResetToken();
  await repo.createPasswordResetToken({
    tokenHash,
    expiresAt,
    userId: user?.id,
    platformAdminId: platformAdmin?.id,
  });

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const sent = await sendEmail(
    email,
    "Restablecer tu contraseña — Operix",
    `Recibimos una solicitud para restablecer tu contraseña.\n\nEste enlace vence en 1 hora:\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.`,
  );

  if (!sent && process.env.NODE_ENV !== "production") {
    console.info(`[password-reset:dev] Sin SMTP configurado — enlace para ${email}:\n${resetUrl}`);
  }

  return { message: GENERIC_REQUEST_MESSAGE };
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashPasswordResetToken(token);
  const record = await repo.findValidPasswordResetToken(tokenHash);

  if (!record) {
    throw new PasswordResetError("Este enlace ya no es válido — pide uno nuevo.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  if (record.userId) {
    await repo.updateUserPassword(record.userId, passwordHash);
    const user = await repo.findUserById(record.userId);
    if (user) {
      await logAudit({
        companyId: user.companyId,
        actorId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
      });
    }
  } else if (record.platformAdminId) {
    await repo.updatePlatformAdminPassword(record.platformAdminId, passwordHash);
  }

  await repo.markPasswordResetTokenUsed(record.id);
}
