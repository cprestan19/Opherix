/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as configRepo from "@/repositories/config.repository";
import { logAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { sendEmail } from "@/lib/notifications/email";
import type { AutoArchiveDelay } from "@/generated/prisma/enums";
import type { EmailConfigInput } from "@/lib/validations/email-config";

export async function updatePayRules(
  companyId: string,
  actorId: string,
  country: string,
  data: { overtimeMultiplier: number; sundayMultiplier: number; holidayMultiplier: number },
) {
  const updated = await configRepo.upsertPayRuleSet(companyId, country, data);
  await logAudit({
    companyId,
    actorId,
    action: "PAY_RULES_UPDATED",
    entityType: "PayRuleSet",
    entityId: updated.id,
    metadata: data,
  });
  return updated;
}

export async function addHoliday(companyId: string, actorId: string, country: string, date: string, name: string) {
  const holiday = await configRepo.createHoliday(companyId, country, new Date(date), name);
  await logAudit({
    companyId,
    actorId,
    action: "HOLIDAY_ADDED",
    entityType: "Holiday",
    entityId: holiday.id,
    metadata: { date, name },
  });
  return holiday;
}

export class ConfigError extends Error {}

export async function removeHoliday(companyId: string, actorId: string, holidayId: string) {
  const deleted = await configRepo.deleteHoliday(companyId, holidayId);
  if (!deleted) throw new ConfigError("Feriado no encontrado.");
  await logAudit({ companyId, actorId, action: "HOLIDAY_REMOVED", entityType: "Holiday", entityId: holidayId });
}

export async function updateAutoArchiveDelay(
  companyId: string,
  actorId: string,
  autoArchiveDelay: AutoArchiveDelay,
) {
  const updated = await configRepo.updateAutoArchiveDelay(companyId, autoArchiveDelay);
  await logAudit({
    companyId,
    actorId,
    action: "AUTO_ARCHIVE_DELAY_UPDATED",
    entityType: "Company",
    entityId: companyId,
    metadata: { autoArchiveDelay },
  });
  return updated;
}

export async function getEmailConfigStatus(companyId: string) {
  const config = await configRepo.getEmailConfig(companyId);
  return {
    smtpHost: config.smtpHost ?? "",
    smtpPort: config.smtpPort ?? 587,
    smtpUser: config.smtpUser ?? "",
    smtpFromEmail: config.smtpFromEmail ?? "",
    smtpFromName: config.smtpFromName ?? "",
    hasPassword: Boolean(config.smtpPasswordEncrypted),
  };
}

/**
 * smtpPassword vacío ("") significa "no cambiar la contraseña guardada" —
 * evita que reabrir el formulario (que nunca recibe la contraseña real de
 * vuelta, ver getEmailConfigStatus) la borre por accidente al guardar.
 */
export async function updateEmailConfig(companyId: string, actorId: string, input: EmailConfigInput) {
  const updated = await configRepo.upsertEmailConfig(companyId, {
    smtpHost: input.smtpHost,
    smtpPort: input.smtpPort,
    smtpUser: input.smtpUser,
    smtpPasswordEncrypted: input.smtpPassword ? encryptSecret(input.smtpPassword) : undefined,
    smtpFromEmail: input.smtpFromEmail,
    smtpFromName: input.smtpFromName,
  });

  await logAudit({
    companyId,
    actorId,
    action: "EMAIL_CONFIG_UPDATED",
    entityType: "Company",
    entityId: companyId,
    metadata: { smtpHost: input.smtpHost, smtpUser: input.smtpUser, smtpFromEmail: input.smtpFromEmail },
  });

  return updated;
}

export async function sendTestEmail(companyId: string, toEmail: string) {
  return sendEmail(
    toEmail,
    "Correo de prueba — Opherix",
    "Este es un correo de prueba de tu configuración SMTP en Opherix. Si lo recibiste, tu configuración funciona correctamente.",
    companyId,
  );
}
