/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
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
