/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findCompanyBySlug(slug: string) {
  return prisma.company.findFirst({ where: { slug, isActive: true } });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

/**
 * Roster público para el selector opcional de personal en
 * /solicitar/[companySlug] (§ el Cliente puede elegir a quién prefiere, sin
 * que eso reemplace la Asignación real que sigue siendo del Administrador).
 * Expone deliberadamente solo foto/nombre/score/carnet de salud — nada de
 * contacto, dirección ni datos sensibles del trabajador.
 */
export function listPublicAvailableWorkers(companyId: string) {
  return prisma.worker.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      photoUrl: true,
      ratingAverage: true,
      ratingCount: true,
      user: { select: { name: true } },
      documents: {
        where: { type: "HEALTH_CARD" },
        select: { expiresAt: true },
      },
    },
    orderBy: { ratingAverage: "desc" },
  });
}

/**
 * Valida que los IDs de preferencia enviados desde el formulario público
 * realmente pertenezcan a esta empresa y sigan activos — nunca confiar en
 * los IDs tal cual llegan de un formulario sin sesión.
 */
export async function filterActiveWorkerIds(companyId: string, workerIds: string[]) {
  if (workerIds.length === 0) return [];
  const workers = await prisma.worker.findMany({
    where: { id: { in: workerIds }, companyId, deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  });
  return workers.map((w) => w.id);
}

export function createWorkerDirect(data: {
  companyId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  specialties: Prisma.WorkerUncheckedCreateInput["specialties"];
}) {
  return prisma.user.create({
    data: {
      companyId: data.companyId,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
      phone: data.phone,
      role: "WORKER",
      status: "ACTIVE",
      worker: {
        create: {
          companyId: data.companyId,
          specialties: data.specialties,
          status: "ACTIVE",
        },
      },
    },
    include: { worker: true },
  });
}

export function createApplicant(data: {
  companyId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  worker: Omit<
    Prisma.WorkerUncheckedCreateWithoutUserInput,
    "healthInfo" | "availabilitySlots" | "companyId" | "documents"
  > & {
    healthInfo?: { allergies?: string; conditions?: string };
    availableDays: number[];
    documents?: { type: Prisma.WorkerDocumentCreateWithoutWorkerInput["type"]; fileUrl: string; fileName: string }[];
  };
}) {
  const { companyId, email, passwordHash, name, phone, worker } = data;
  const { healthInfo, availableDays, documents, ...workerFields } = worker;

  return prisma.user.create({
    data: {
      companyId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
      role: "APPLICANT",
      status: "ACTIVE",
      worker: {
        create: {
          companyId,
          ...workerFields,
          healthInfo:
            healthInfo && (healthInfo.allergies || healthInfo.conditions)
              ? { create: healthInfo }
              : undefined,
          availabilitySlots: {
            create: availableDays.map((dayOfWeek) => ({
              dayOfWeek,
              startTime: "08:00",
              endTime: "18:00",
            })),
          },
          documents: documents && documents.length > 0 ? { create: documents } : undefined,
        },
      },
    },
    include: { worker: true },
  });
}

export function listPendingApplications(companyId: string) {
  return prisma.worker.findMany({
    where: { companyId, status: "PENDING_REVIEW" },
    include: { user: { select: { name: true, email: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function findWorkerById(companyId: string, workerId: string) {
  return prisma.worker.findFirst({
    where: { id: workerId, companyId },
    include: {
      user: { select: { name: true, email: true, phone: true, username: true, status: true } },
      documents: true,
    },
  });
}

export interface WorkerListFilters {
  specialty?: Prisma.EnumSpecialtyFilter["equals"];
  status?: Prisma.EnumWorkerStatusFilter["equals"];
  search?: string;
}

export function listWorkers(companyId: string, filters: WorkerListFilters = {}) {
  const { specialty, status, search } = filters;

  return prisma.worker.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: status ?? { in: ["APPROVED", "ACTIVE"] },
      specialties: specialty ? { has: specialty } : undefined,
      user: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { ratingAverage: "desc" },
  });
}

export function listDeletedWorkers(companyId: string) {
  return prisma.worker.findMany({
    where: { companyId, deletedAt: { not: null } },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { deletedAt: "desc" },
  });
}

export function getWorkerDetail(companyId: string, workerId: string) {
  return prisma.worker.findFirst({
    where: { id: workerId, companyId },
    include: {
      user: {
        select: { name: true, email: true, phone: true, createdAt: true, username: true, status: true },
      },
      documents: { orderBy: { uploadedAt: "desc" } },
      availabilitySlots: { orderBy: { dayOfWeek: "asc" } },
      timeOffs: { orderBy: { startDate: "desc" }, take: 10 },
      healthInfo: true,
      assignments: {
        where: { ratingScore: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { event: { select: { title: true, startAt: true } } },
      },
    },
  });
}

export function approveWorker(workerId: string, approvedById: string) {
  return prisma.$transaction(async (tx) => {
    const worker = await tx.worker.update({
      where: { id: workerId },
      data: { status: "APPROVED", approvedById, approvedAt: new Date(), rejectionReason: null },
    });
    await tx.user.update({ where: { id: worker.userId }, data: { role: "WORKER" } });
    return worker;
  });
}

export function rejectWorker(workerId: string, approvedById: string, reason: string) {
  return prisma.worker.update({
    where: { id: workerId },
    data: { status: "REJECTED", approvedById, approvedAt: new Date(), rejectionReason: reason },
  });
}

export interface UpdateWorkerProfileData {
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  nationality: string;
  birthDate: Date;
  address: string;
  maritalStatus: string;
  hasChildren: boolean;
  childrenCount: number;
  photoUrl?: string;
  education: string;
  courses: string[];
  languages: string[];
  specialties: Prisma.WorkerUncheckedUpdateInput["specialties"];
  experienceYears: number;
  previousEmployers: Prisma.InputJsonValue;
  licenses: string[];
  hasVehicle: boolean;
  vehicleType?: string | null;
  uniformSizes: Prisma.InputJsonValue;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies?: string;
  conditions?: string;
}

export function updateWorkerProfile(workerId: string, userId: string, data: UpdateWorkerProfileData) {
  const { allergies, conditions, ...workerFields } = data;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email.toLowerCase(), phone: data.phone },
    });

    const worker = await tx.worker.update({
      where: { id: workerId },
      data: {
        idNumber: workerFields.idNumber,
        nationality: workerFields.nationality,
        birthDate: workerFields.birthDate,
        address: workerFields.address,
        maritalStatus: workerFields.maritalStatus,
        hasChildren: workerFields.hasChildren,
        childrenCount: workerFields.childrenCount,
        photoUrl: workerFields.photoUrl,
        education: workerFields.education,
        courses: workerFields.courses,
        languages: workerFields.languages,
        specialties: workerFields.specialties,
        experienceYears: workerFields.experienceYears,
        previousEmployers: workerFields.previousEmployers,
        licenses: workerFields.licenses,
        hasVehicle: workerFields.hasVehicle,
        vehicleType: workerFields.vehicleType,
        uniformSizes: workerFields.uniformSizes,
        emergencyContactName: workerFields.emergencyContactName,
        emergencyContactPhone: workerFields.emergencyContactPhone,
      },
    });

    await tx.workerHealthInfo.upsert({
      where: { workerId },
      create: { workerId, allergies, conditions },
      update: { allergies, conditions },
    });

    return worker;
  });
}

export function setWorkerStatus(workerId: string, status: "ACTIVE" | "INACTIVE") {
  return prisma.worker.update({ where: { id: workerId }, data: { status } });
}

/**
 * Soft-delete (§ CLAUDE.md §4/§9.9 — nunca borrado físico): además de ocultar
 * al trabajador del directorio, suspende su cuenta (User.status) para que
 * pierda acceso al portal — a diferencia de status=INACTIVE, que solo lo
 * pausa sin tocar su acceso.
 */
export async function softDeleteWorker(companyId: string, workerId: string, reason: string) {
  const worker = await prisma.worker.findFirst({ where: { id: workerId, companyId, deletedAt: null } });
  if (!worker) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.worker.update({
      where: { id: workerId },
      data: { deletedAt: new Date(), deletedReason: reason, status: "INACTIVE" },
    });
    await tx.user.update({ where: { id: worker.userId }, data: { status: "SUSPENDED" } });
    return updated;
  });
}

export async function restoreWorker(companyId: string, workerId: string) {
  const worker = await prisma.worker.findFirst({ where: { id: workerId, companyId, deletedAt: { not: null } } });
  if (!worker) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.worker.update({
      where: { id: workerId },
      data: { deletedAt: null, deletedReason: null },
    });
    await tx.user.update({ where: { id: worker.userId }, data: { status: "ACTIVE" } });
    return updated;
  });
}

/** username ya guardado (si existe) — para el bucle de resolución de colisiones en worker.service.ts. */
export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

/**
 * Otorga/reenvía acceso al portal (§ /admin/personal "Dar acceso al portal"):
 * fija username (solo la primera vez — ver worker.service.ts) y contraseña,
 * reactiva la cuenta y limpia cualquier bloqueo previo por intentos fallidos.
 */
export function grantPortalAccess(
  userId: string,
  data: { username: string; passwordHash: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      username: data.username,
      passwordHash: data.passwordHash,
      status: "ACTIVE",
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/** Revoca acceso al portal — bloquea el login de inmediato, sin afectar el estado operativo (Worker.status). */
export function revokePortalAccess(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
}
