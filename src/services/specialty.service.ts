/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as specialtyRepo from "@/repositories/specialty.repository";
import { logAudit } from "@/lib/audit";

export class SpecialtyError extends Error {}

export function listActiveSpecialties(companyId: string) {
  return specialtyRepo.listActiveSpecialties(companyId);
}

export function listAllSpecialties(companyId: string) {
  return specialtyRepo.listAllSpecialties(companyId);
}

/**
 * Valida que todos los `specialtyId` recibidos de un formulario (varios son
 * públicos y sin sesión, § /solicitar/[companySlug]) pertenezcan a esta
 * empresa y estén activos — nunca confiar en IDs tal cual llegan del
 * cliente. Devuelve los ids validados o lanza si alguno no corresponde.
 */
export async function assertActiveSpecialtiesBelongToCompany(companyId: string, specialtyIds: string[]) {
  const uniqueIds = [...new Set(specialtyIds)];
  const found = await specialtyRepo.findActiveSpecialtiesByIds(companyId, uniqueIds);
  if (found.length !== uniqueIds.length) {
    throw new SpecialtyError("Una o más especialidades seleccionadas ya no están disponibles.");
  }
  return found;
}

export async function createSpecialty(companyId: string, actorId: string, name: string) {
  const trimmed = name.trim();
  const existing = await specialtyRepo.findSpecialtyByName(companyId, trimmed);
  if (existing) throw new SpecialtyError("Ya existe una especialidad con ese nombre.");

  const specialty = await specialtyRepo.createSpecialty(companyId, trimmed);

  await logAudit({
    companyId,
    actorId,
    action: "SPECIALTY_CREATED",
    entityType: "Specialty",
    entityId: specialty.id,
    metadata: { name: specialty.name },
  });

  return specialty;
}

export async function renameSpecialty(companyId: string, actorId: string, id: string, name: string) {
  const trimmed = name.trim();
  const existing = await specialtyRepo.findSpecialtyByName(companyId, trimmed);
  if (existing && existing.id !== id) throw new SpecialtyError("Ya existe una especialidad con ese nombre.");

  const specialty = await specialtyRepo.renameSpecialty(companyId, id, trimmed);
  if (!specialty) throw new SpecialtyError("Especialidad no encontrada.");

  await logAudit({
    companyId,
    actorId,
    action: "SPECIALTY_RENAMED",
    entityType: "Specialty",
    entityId: specialty.id,
    metadata: { name: specialty.name },
  });

  return specialty;
}

export async function archiveSpecialty(companyId: string, actorId: string, id: string) {
  const specialty = await specialtyRepo.archiveSpecialty(companyId, id);
  if (!specialty) throw new SpecialtyError("Especialidad no encontrada.");

  await logAudit({
    companyId,
    actorId,
    action: "SPECIALTY_ARCHIVED",
    entityType: "Specialty",
    entityId: specialty.id,
    metadata: { name: specialty.name },
  });

  return specialty;
}

export async function restoreSpecialty(companyId: string, actorId: string, id: string) {
  const specialty = await specialtyRepo.restoreSpecialty(companyId, id);
  if (!specialty) throw new SpecialtyError("Especialidad no encontrada.");

  await logAudit({
    companyId,
    actorId,
    action: "SPECIALTY_RESTORED",
    entityType: "Specialty",
    entityId: specialty.id,
    metadata: { name: specialty.name },
  });

  return specialty;
}
