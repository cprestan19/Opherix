/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  createPlatformAdminSchema,
  type CreatePlatformAdminInput,
} from "@/lib/validations/platform-admin";
import { createPlatformAdmin, removePlatformAdmin, PlatformError } from "@/services/platform.service";
import { requireRole } from "@/lib/tenant";

export interface CreatePlatformAdminResult {
  error?: string;
}

export async function createPlatformAdminAction(
  input: CreatePlatformAdminInput,
): Promise<CreatePlatformAdminResult> {
  await requireRole("PLATFORM_ADMIN");
  const parsed = createPlatformAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos del formulario." };
  }

  try {
    await createPlatformAdmin(parsed.data);
  } catch (error) {
    if (error instanceof PlatformError) return { error: error.message };
    throw error;
  }

  revalidatePath("/platform/equipo");
  return {};
}

export interface RemovePlatformAdminResult {
  error?: string;
}

export async function removePlatformAdminAction(adminId: string): Promise<RemovePlatformAdminResult> {
  await requireRole("PLATFORM_ADMIN");
  try {
    await removePlatformAdmin(adminId);
  } catch (error) {
    if (error instanceof PlatformError) return { error: error.message };
    throw error;
  }

  revalidatePath("/platform/equipo");
  return {};
}
