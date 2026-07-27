/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyStaff } from "@/lib/tenant";
import { approveApplication, rejectApplication } from "@/services/recruitment.service";

export async function approveApplicationAction(workerId: string) {
  const { user, companyId } = await requireCompanyStaff();
  await approveApplication(companyId, workerId, user.id);
  revalidatePath("/admin/reclutamiento");
  revalidatePath("/admin/personal", "layout");
}

export async function rejectApplicationAction(workerId: string, reason: string) {
  const { user, companyId } = await requireCompanyStaff();
  await rejectApplication(companyId, workerId, user.id, reason);
  revalidatePath("/admin/reclutamiento");
  revalidatePath("/admin/personal", "layout");
}
