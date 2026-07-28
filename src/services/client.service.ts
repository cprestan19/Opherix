/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as clientRepo from "@/repositories/client.repository";
import { logAudit } from "@/lib/audit";

export class ClientError extends Error {}

export interface CreateClientInput {
  businessName: string;
  taxId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
}

export async function createClient(companyId: string, actorId: string, input: CreateClientInput) {
  const existing = await clientRepo.findClientByEmail(companyId, input.contactEmail);
  if (existing) {
    throw new ClientError("Ya existe un cliente con este correo de contacto.");
  }

  const client = await clientRepo.createClient({
    companyId,
    businessName: input.businessName,
    taxId: input.taxId,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    address: input.address,
  });

  await logAudit({
    companyId,
    actorId,
    action: "CLIENT_CREATED",
    entityType: "Client",
    entityId: client.id,
  });

  return client;
}

export async function listClients(companyId: string) {
  return clientRepo.listClients(companyId);
}

/**
 * Archivar/reactivar cliente (soft-delete, § CLAUDE.md §4 — nunca borrado
 * físico): un cliente archivado deja de aparecer entre las opciones al crear
 * un evento nuevo, pero conserva su historial de solicitudes y facturación.
 */
export async function setClientActiveStatus(
  companyId: string,
  actorId: string,
  clientId: string,
  isActive: boolean,
) {
  const client = await clientRepo.setClientActive(companyId, clientId, isActive);
  if (!client) throw new ClientError("Cliente no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: isActive ? "CLIENT_REACTIVATED" : "CLIENT_ARCHIVED",
    entityType: "Client",
    entityId: clientId,
  });

  return client;
}

/**
 * Eliminación lógica (soft-delete, § CLAUDE.md §4/§9.9 — nunca borrado
 * físico): distinto de archivar/inactivar, oculta al cliente de toda la
 * app. Reversible desde la vista de "Eliminados".
 */
export async function deleteClient(companyId: string, actorId: string, clientId: string, reason: string) {
  const client = await clientRepo.softDeleteClient(companyId, clientId, reason);
  if (!client) throw new ClientError("Cliente no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "CLIENT_DELETED",
    entityType: "Client",
    entityId: clientId,
    metadata: { reason },
  });

  return client;
}

export async function restoreClient(companyId: string, actorId: string, clientId: string) {
  const client = await clientRepo.restoreClient(companyId, clientId);
  if (!client) throw new ClientError("Cliente no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "CLIENT_RESTORED",
    entityType: "Client",
    entityId: clientId,
  });

  return client;
}

export async function listDeletedClients(companyId: string) {
  return clientRepo.listDeletedClients(companyId);
}

export async function getClientById(companyId: string, clientId: string) {
  const client = await clientRepo.findClientById(companyId, clientId);
  if (!client) throw new ClientError("Cliente no encontrado.");
  return client;
}

/** URL propia del cliente para crear eventos nuevos sin volver a llenar sus datos (§ /solicitar/[companySlug]/cliente/[token]). */
export async function getClientAccessToken(companyId: string, clientId: string) {
  const token = await clientRepo.getOrCreateAccessToken(companyId, clientId);
  if (!token) throw new ClientError("Cliente no encontrado.");
  return token;
}

/** Invalida el enlace anterior y emite uno nuevo — para cuando se comparte por error o se quiere rotar. */
export async function regenerateClientAccessToken(companyId: string, actorId: string, clientId: string) {
  const token = await clientRepo.regenerateAccessToken(companyId, clientId);
  if (!token) throw new ClientError("Cliente no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "CLIENT_ACCESS_TOKEN_REGENERATED",
    entityType: "Client",
    entityId: clientId,
  });

  return token;
}

export async function getClientEventsHistory(companyId: string, clientId: string) {
  const events = await clientRepo.listEventsHistoryForClient(companyId, clientId);
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startAt: e.startAt,
    endAt: e.endAt,
    status: e.status,
    staffCount: e.assignments.length,
    totalCharged: e.invoices[0] ? Number(e.invoices[0].amount) : null,
    invoiceStatus: e.invoices[0]?.status ?? null,
  }));
}
