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
import { createCompanyUserSchema, type CreateCompanyUserInput } from "@/lib/validations/company-user";
import { createCompanyUser, setCompanyUserRole, setCompanyUserStatus, CompanyUserError } from "@/services/company-user.service";
import type { UserRole } from "@/generated/prisma/enums";

export interface CompanyUserActionResult {
  error?: string;
}

export async function createCompanyUserAction(input: CreateCompanyUserInput): Promise<CompanyUserActionResult> {
  const parsed = createCompanyUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireAdmin();

  try {
    await createCompanyUser(companyId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof CompanyUserError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/usuarios");
  return {};
}

export async function setCompanyUserRoleAction(targetUserId: string, role: UserRole): Promise<CompanyUserActionResult> {
  const { user, companyId } = await requireAdmin();

  try {
    await setCompanyUserRole(companyId, user.id, targetUserId, role);
  } catch (error) {
    if (error instanceof CompanyUserError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/usuarios");
  return {};
}

export async function setCompanyUserStatusAction(
  targetUserId: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<CompanyUserActionResult> {
  const { user, companyId } = await requireAdmin();

  try {
    await setCompanyUserStatus(companyId, user.id, targetUserId, status);
  } catch (error) {
    if (error instanceof CompanyUserError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/usuarios");
  return {};
}
