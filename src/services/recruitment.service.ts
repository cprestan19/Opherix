/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { WorkerApplicationInput } from "@/lib/validations/worker-application";
import * as workerRepo from "@/repositories/worker.repository";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";

export class ApplicationError extends Error {}

export async function submitApplication(companySlug: string, input: WorkerApplicationInput) {
  const company = await workerRepo.findCompanyBySlug(companySlug);
  if (!company) {
    throw new ApplicationError("Empresa no encontrada o inactiva.");
  }

  const existingUser = await workerRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ApplicationError("Ya existe una cuenta con este correo.");
  }

  // Sin campo de contraseña en el formulario público: se genera una al azar
  // (nunca expuesta) y el aspirante la establece luego vía "¿Olvidaste tu
  // contraseña?" (src/services/password-reset.service.ts).
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

  const user = await workerRepo.createApplicant({
    companyId: company.id,
    email: input.email,
    passwordHash,
    name: input.name,
    phone: input.phone,
    worker: {
      idNumber: input.idNumber,
      nationality: input.nationality,
      birthDate: new Date(input.birthDate),
      address: input.address,
      maritalStatus: input.maritalStatus,
      hasChildren: input.hasChildren,
      childrenCount: input.hasChildren ? (input.childrenCount ?? 0) : 0,
      education: input.education,
      courses: input.courses,
      languages: input.languages,
      specialties: input.specialties,
      experienceYears: input.experienceYears,
      previousEmployers: input.previousEmployers,
      references: input.references,
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
      photoUrl: input.photoUrl,
      healthInfo: {
        allergies: input.allergies,
        conditions: input.conditions,
      },
      availableDays: input.availableDays,
      documents: [
        { type: "ID_CARD" as const, fileUrl: input.idDocumentUrl, fileName: input.idDocumentName },
        ...(input.healthCardUrl
          ? [
              {
                type: "HEALTH_CARD" as const,
                fileUrl: input.healthCardUrl,
                fileName: input.healthCardName ?? "carnet-salud",
              },
            ]
          : []),
      ],
    },
  });

  await logAudit({
    companyId: company.id,
    actorId: user.id,
    action: "APPLICATION_SUBMITTED",
    entityType: "Worker",
    entityId: user.worker!.id,
    metadata: { specialties: input.specialties },
  });

  return user;
}

export async function listPendingApplications(companyId: string) {
  const applications = await workerRepo.listPendingApplications(companyId);
  // Prisma `Decimal` no es serializable al cruzar de Server a Client
  // Component — se convierte a string antes de devolverlo (mismo patrón que
  // WorkerCv ya usa para ratingAverage).
  return applications.map((application) => ({
    ...application,
    hourlyRate: application.hourlyRate?.toString() ?? null,
    ratingAverage: application.ratingAverage.toString(),
  }));
}

export async function approveApplication(companyId: string, workerId: string, actorId: string) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new ApplicationError("Aspirante no encontrado.");

  const updated = await workerRepo.approveWorker(workerId, actorId);

  await logAudit({
    companyId,
    actorId,
    action: "APPLICATION_APPROVED",
    entityType: "Worker",
    entityId: workerId,
  });

  await dispatchNotification({
    companyId,
    userId: worker.userId,
    type: "APPLICATION_APPROVED",
    title: "¡Postulación aprobada!",
    body: "Tu perfil fue aprobado. Ya puedes configurar tu disponibilidad y recibir asignaciones.",
    relatedEntityType: "Worker",
    relatedEntityId: workerId,
  });

  return updated;
}

export async function rejectApplication(
  companyId: string,
  workerId: string,
  actorId: string,
  reason: string,
) {
  const worker = await workerRepo.findWorkerById(companyId, workerId);
  if (!worker) throw new ApplicationError("Aspirante no encontrado.");

  const updated = await workerRepo.rejectWorker(workerId, actorId, reason);

  await logAudit({
    companyId,
    actorId,
    action: "APPLICATION_REJECTED",
    entityType: "Worker",
    entityId: workerId,
    metadata: { reason },
  });

  await dispatchNotification({
    companyId,
    userId: worker.userId,
    type: "APPLICATION_REJECTED",
    title: "Actualización de tu postulación",
    body: `Tu postulación no fue aprobada. Motivo: ${reason}`,
    relatedEntityType: "Worker",
    relatedEntityId: workerId,
  });

  return updated;
}
