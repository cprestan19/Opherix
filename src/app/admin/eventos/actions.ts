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
import { adminEventSchema, type AdminEventInput } from "@/lib/validations/event";
import { createEventByAdmin, EventError } from "@/services/event.service";

export interface EventFormActionResult {
  error?: string;
}

export async function createEventAdminAction(input: AdminEventInput): Promise<EventFormActionResult> {
  const parsed = adminEventSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireCompanyStaff();

  try {
    await createEventByAdmin(companyId, parsed.data.clientId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/eventos");
  return {};
}
