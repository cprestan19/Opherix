/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  updateBranding,
  updatePayRules,
  addHoliday,
  removeHoliday,
  updateAutoArchiveDelay,
  updateEmailConfig,
  sendTestEmail,
} from "@/services/config.service";
import {
  saveClientSpecialtyRates,
  ClientSpecialtyRateError,
} from "@/services/client-specialty-rate.service";
import { clientSpecialtyRateSchema, type ClientSpecialtyRateInput } from "@/lib/validations/client-specialty-rate";
import { emailConfigSchema, type EmailConfigInput } from "@/lib/validations/email-config";
import type { AutoArchiveDelay } from "@/generated/prisma/enums";

export interface ConfigActionResult {
  error?: string;
}

// Configuración de empresa (branding, tarifas, feriados) es exclusiva de
// ADMIN — un SUPERVISOR puede operar el día a día pero no cambiar reglas
// de negocio de toda la compañía.

export async function updateBrandingAction(data: {
  name: string;
  taxId?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}) {
  const { user, companyId } = await requireAdmin();
  await updateBranding(companyId, user.id, data);
  revalidatePath("/admin/configuracion");
}

export async function updatePayRulesAction(data: {
  overtimeMultiplier: number;
  sundayMultiplier: number;
  holidayMultiplier: number;
}) {
  const { user, companyId } = await requireAdmin();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  await updatePayRules(companyId, user.id, company.country, data);
  revalidatePath("/admin/configuracion");
}

export async function addHolidayAction(date: string, name: string) {
  const { user, companyId } = await requireAdmin();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  await addHoliday(companyId, user.id, company.country, date, name);
  revalidatePath("/admin/configuracion");
}

export async function removeHolidayAction(holidayId: string) {
  const { user, companyId } = await requireAdmin();
  await removeHoliday(companyId, user.id, holidayId);
  revalidatePath("/admin/configuracion");
}

export async function updateAutoArchiveDelayAction(autoArchiveDelay: AutoArchiveDelay) {
  const { user, companyId } = await requireAdmin();
  await updateAutoArchiveDelay(companyId, user.id, autoArchiveDelay);
  revalidatePath("/admin/configuracion");
}

export async function saveClientSpecialtyRatesAction(
  input: ClientSpecialtyRateInput,
): Promise<ConfigActionResult> {
  const parsed = clientSpecialtyRateSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los valores ingresados." };

  const { user, companyId } = await requireAdmin();

  try {
    await saveClientSpecialtyRates(companyId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof ClientSpecialtyRateError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/configuracion");
  return {};
}

export async function updateEmailConfigAction(input: EmailConfigInput): Promise<ConfigActionResult> {
  const parsed = emailConfigSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los valores ingresados." };

  const { user, companyId } = await requireAdmin();
  await updateEmailConfig(companyId, user.id, parsed.data);
  revalidatePath("/admin/configuracion");
  return {};
}

export async function sendTestEmailAction(): Promise<ConfigActionResult> {
  const { user, companyId } = await requireAdmin();
  if (!user.email) return { error: "Tu cuenta no tiene un correo asociado." };
  const sent = await sendTestEmail(companyId, user.email);
  if (!sent) return { error: "No se pudo enviar el correo de prueba. Revisa los datos SMTP." };
  return {};
}
