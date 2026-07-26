/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createCompanySchema, type CreateCompanyInput } from "@/lib/validations/platform";
import { createCompany, setCompanyActive, deleteCompany, PlatformError } from "@/services/platform.service";
import { requireRole } from "@/lib/tenant";

export interface CreateCompanyResult {
  error?: string;
}

export async function createCompanyAction(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  await requireRole("PLATFORM_ADMIN");
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos del formulario." };
  }

  try {
    await createCompany(parsed.data);
  } catch (error) {
    if (error instanceof PlatformError) return { error: error.message };
    throw error;
  }

  revalidatePath("/platform/empresas");
  revalidatePath("/platform");
  return {};
}

export async function setCompanyActiveAction(companyId: string, isActive: boolean) {
  await requireRole("PLATFORM_ADMIN");
  await setCompanyActive(companyId, isActive);
  revalidatePath("/platform/empresas");
}

export interface DeleteCompanyResult {
  error?: string;
}

export async function deleteCompanyAction(
  companyId: string,
  confirmName: string,
): Promise<DeleteCompanyResult> {
  const user = await requireRole("PLATFORM_ADMIN");

  try {
    await deleteCompany(companyId, confirmName, { id: user.id, email: user.email ?? "" });
  } catch (error) {
    if (error instanceof PlatformError) return { error: error.message };
    throw error;
  }

  revalidatePath("/platform/empresas");
  revalidatePath("/platform");
  return {};
}
