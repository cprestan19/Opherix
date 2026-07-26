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
import { updatePayRules, addHoliday, removeHoliday, updateAutoArchiveDelay } from "@/services/config.service";
import { updateCompanyBranding } from "@/repositories/config.repository";
import type { AutoArchiveDelay } from "@/generated/prisma/enums";

// Configuración de empresa (branding, tarifas, feriados) es exclusiva de
// ADMIN — un SUPERVISOR puede operar el día a día pero no cambiar reglas
// de negocio de toda la compañía.

export async function updateBrandingAction(name: string) {
  const { companyId } = await requireAdmin();
  await updateCompanyBranding(companyId, { name });
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
