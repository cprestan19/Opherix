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
import {
  createClient,
  updateClient,
  setClientActiveStatus,
  deleteClient,
  restoreClient,
  getClientAccessToken,
  regenerateClientAccessToken,
  ClientError,
} from "@/services/client.service";

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

export interface UpdateClientResult {
  error?: string;
}

export async function updateClientAction(clientId: string, input: CreateClientInput): Promise<UpdateClientResult> {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireCompanyStaff();

  try {
    await updateClient(companyId, user.id, clientId, parsed.data);
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clientId}`);
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

export async function deleteClientAction(clientId: string, reason: string): Promise<SetClientActiveResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await deleteClient(companyId, user.id, clientId, reason);
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/eventos");
  return {};
}

export async function restoreClientAction(clientId: string): Promise<SetClientActiveResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await restoreClient(companyId, user.id, clientId);
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/eventos");
  return {};
}

export interface ClientAccessLinkResult {
  error?: string;
  token?: string;
}

export async function getClientAccessLinkAction(clientId: string): Promise<ClientAccessLinkResult> {
  const { companyId } = await requireCompanyStaff();

  try {
    const token = await getClientAccessToken(companyId, clientId);
    return { token };
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }
}

export async function regenerateClientAccessLinkAction(clientId: string): Promise<ClientAccessLinkResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    const token = await regenerateClientAccessToken(companyId, user.id, clientId);
    revalidatePath(`/admin/clientes/${clientId}`);
    return { token };
  } catch (error) {
    if (error instanceof ClientError) return { error: error.message };
    throw error;
  }
}
