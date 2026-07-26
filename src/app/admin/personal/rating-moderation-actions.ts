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
import { reviewRating } from "@/services/rating.service";

export async function reviewRatingAction(assignmentId: string, decision: "APPROVED" | "REJECTED") {
  const { user, companyId } = await requireCompanyStaff();
  await reviewRating(companyId, user.id, assignmentId, decision);
  revalidatePath("/admin/personal");
}
