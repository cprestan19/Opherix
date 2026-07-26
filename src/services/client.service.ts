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
