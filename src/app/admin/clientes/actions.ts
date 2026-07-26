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
import { createClientSchema, type CreateClientInput } from "@/lib/validations/client";
import { createClient, setClientActiveStatus, ClientError } from "@/services/client.service";

export interface CreateClientResult {
  error?: string;
}

export async function createClientAction(input: CreateClientInput): Promise<CreateClientResult> {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireCompanyStaff();

  try {
    await createClient(companyId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/eventos");
  return {};
}

export interface SetClientActiveResult {
  error?: string;
}

export async function setClientActiveAction(clientId: string, isActive: boolean): Promise<SetClientActiveResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await setClientActiveStatus(companyId, user.id, clientId, isActive);
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/eventos");
  return {};
}
