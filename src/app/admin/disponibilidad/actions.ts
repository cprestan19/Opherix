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
import { reviewTimeOff } from "@/services/availability.service";

export async function reviewTimeOffAction(timeOffId: string, decision: "APPROVED" | "REJECTED") {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  await reviewTimeOff(companyId, timeOffId, user.id, decision);
  revalidatePath("/admin/disponibilidad");
}
