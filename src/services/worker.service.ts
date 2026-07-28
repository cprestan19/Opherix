/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import bcrypt from "bcryptjs";
import * as workerRepo from "@/repositories/worker.repository";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { buildUsernameCandidate } from "@/lib/username";
import { generateReadablePassword } from "@/lib/generate-password";
import type { WorkerEditInput } from "@/lib/validations/worker-edit";
import type { CreateWorkerInput } from "@/lib/validations/worker-create";

export class WorkerError extends Error {}

export async function createWorker(companyId: string, actorId: string, input: CreateWorkerInput) {
  const existing = await workerRepo.findUserByEmail(input.email);
  if (existing) {
    throw new WorkerError("Ya existe una cuenta con este correo.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await workerRepo.createWorkerDirect({
    companyId,
    email: input.email,
    passwordHash,
    name: input.name,
    phone: input.phone,
    specialties: input.specialties,
  });

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_CREATED",
    entityType: "Worker",
    entityId: user.worker!.id,
  });

  return user;
}

export async function updateWorkerProfile(
  companyId: string,
  actorId: string,
  workerId: string,
  input: WorkerEditInput,
) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");

  if (input.email.toLowerCase() !== worker.user.email.toLowerCase()) {
    const existing = await workerRepo.findUserByEmail(input.email);
    if (existing && existing.id !== worker.userId) {
      throw new WorkerError("Ya existe una cuenta con este correo.");
    }
  }

  const updated = await workerRepo.updateWorkerProfile(workerId, worker.userId, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    idNumber: input.idNumber,
    nationality: input.nationality,
    birthDate: new Date(input.birthDate),
    address: input.address,
    maritalStatus: input.maritalStatus,
    hasChildren: input.hasChildren,
    childrenCount: input.hasChildren ? (input.childrenCount ?? 0) : 0,
    photoUrl: input.photoUrl,
    education: input.education,
    courses: input.courses,
    languages: input.languages,
    specialties: input.specialties,
    experienceYears: input.experienceYears,
    previousEmployers: input.previousEmployers,
    licenses: input.licenses,
    hasVehicle: input.hasVehicle,
    vehicleType: input.hasVehicle ? input.vehicleType : null,
    uniformSizes: {
      shirt: input.uniformShirtSize,
      pants: input.uniformPantsSize,
      shoes: input.uniformShoeSize,
    },
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    allergies: input.allergies,
    conditions: input.conditions,
  });

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_UPDATED",
    entityType: "Worker",
    entityId: workerId,
  });

  return updated;
}

export async function setWorkerAccountStatus(
  companyId: string,
  actorId: string,
  workerId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");

  const updated = await workerRepo.setWorkerStatus(workerId, status);

  await logAudit({
    companyId,
    actorId,
    action: status === "ACTIVE" ? "WORKER_ACTIVATED" : "WORKER_SUSPENDED",
    entityType: "Worker",
    entityId: workerId,
  });

  await dispatchNotification({
    companyId,
    userId: worker.userId,
    type: status === "ACTIVE" ? "WORKER_ACTIVATED" : "WORKER_SUSPENDED",
    title: status === "ACTIVE" ? "Tu cuenta fue reactivada" : "Tu cuenta fue suspendida",
    body:
      status === "ACTIVE"
        ? "Ya puedes volver a recibir asignaciones."
        : "Un administrador suspendió tu cuenta. Contacta a tu empresa para más información.",
    relatedEntityType: "Worker",
    relatedEntityId: workerId,
  });

  return updated;
}

/**
 * Eliminación lógica (soft-delete, § CLAUDE.md §4/§9.9 — nunca borrado
 * físico): distinto de status=INACTIVE (pausa reversible), esto oculta al
 * trabajador de todo el directorio y suspende su acceso al portal
 * (workerRepo.softDeleteWorker también pone User.status=SUSPENDED).
 * Reversible desde la vista de "Eliminados".
 */
export async function deleteWorker(companyId: string, actorId: string, workerId: string, reason: string) {
  const worker = await workerRepo.softDeleteWorker(companyId, workerId, reason);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_DELETED",
    entityType: "Worker",
    entityId: workerId,
    metadata: { reason },
  });

  return worker;
}

export async function restoreWorker(companyId: string, actorId: string, workerId: string) {
  const worker = await workerRepo.restoreWorker(companyId, workerId);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_RESTORED",
    entityType: "Worker",
    entityId: workerId,
  });

  return worker;
}

export async function listDeletedWorkers(companyId: string) {
  return workerRepo.listDeletedWorkers(companyId);
}

/**
 * Resuelve un username libre a partir del nombre del trabajador, probando
 * sufijos numéricos ante colisión (jperez, jperez2, jperez3...). Nunca se
 * llama si el trabajador ya tiene username (ver grantPortalAccess) — una vez
 * asignado, se mantiene estable aunque se reenvíe el acceso.
 */
async function resolveAvailableUsername(fullName: string): Promise<string> {
  const base = buildUsernameCandidate(fullName);
  let candidate = base;
  let suffix = 2;
  while (await workerRepo.findUserByUsername(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Otorga o reenvía acceso al portal (§ /admin/personal "Dar acceso al
 * portal"): genera un username estable la primera vez (se conserva en
 * reenvíos posteriores) y SIEMPRE una contraseña nueva — cada click es una
 * emisión explícita de credenciales que el Administrador va a compartir por
 * WhatsApp, así que no tiene sentido reciclar una contraseña ya compartida
 * antes. La contraseña en claro se devuelve una sola vez a quien llama (la
 * action del portal admin) para mostrarla/copiarla — nunca se persiste ni se
 * escribe en logAudit.
 */
export async function grantPortalAccess(companyId: string, actorId: string, workerId: string) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");
  if (worker.deletedAt) throw new WorkerError("No se puede otorgar acceso a un trabajador eliminado.");

  const username = worker.user.username ?? (await resolveAvailableUsername(worker.user.name));
  const password = generateReadablePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await workerRepo.grantPortalAccess(worker.userId, { username, passwordHash });

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_PORTAL_ACCESS_GRANTED",
    entityType: "User",
    entityId: worker.userId,
    metadata: { username },
  });

  return { username, password };
}

export async function revokePortalAccess(companyId: string, actorId: string, workerId: string) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new WorkerError("Trabajador no encontrado.");

  await workerRepo.revokePortalAccess(worker.userId);

  await logAudit({
    companyId,
    actorId,
    action: "WORKER_PORTAL_ACCESS_REVOKED",
    entityType: "User",
    entityId: worker.userId,
  });
}
