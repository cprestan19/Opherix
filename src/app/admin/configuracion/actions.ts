/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { updatePayRules, addHoliday, removeHoliday } from "@/services/config.service";
import { updateCompanyBranding } from "@/repositories/config.repository";

export async function updateBrandingAction(name: string) {
  const companyId = await getEffectiveCompanyId();
  await updateCompanyBranding(companyId, { name });
  revalidatePath("/admin/configuracion");
}

export async function updatePayRulesAction(data: {
  overtimeMultiplier: number;
  sundayMultiplier: number;
  holidayMultiplier: number;
}) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  await updatePayRules(companyId, user.id, company.country, data);
  revalidatePath("/admin/configuracion");
}

export async function addHolidayAction(date: string, name: string) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  await addHoliday(companyId, user.id, company.country, date, name);
  revalidatePath("/admin/configuracion");
}

export async function removeHolidayAction(holidayId: string) {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await removeHoliday(companyId, user.id, holidayId);
  revalidatePath("/admin/configuracion");
}
