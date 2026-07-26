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
      user: { select: { name: true, email: true, phone: true } },
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

export function getWorkerDetail(companyId: string, workerId: string) {
  return prisma.worker.findFirst({
    where: { id: workerId, companyId },
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
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
  hourlyRate?: number;
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
        hourlyRate: workerFields.hourlyRate,
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
