/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { AutoArchiveDelay } from "@/generated/prisma/enums";

export function getCompany(companyId: string) {
  return prisma.company.findUniqueOrThrow({ where: { id: companyId } });
}

export function updateCompanyBranding(companyId: string, data: { name: string }) {
  return prisma.company.update({ where: { id: companyId }, data });
}

export function updateAutoArchiveDelay(companyId: string, autoArchiveDelay: AutoArchiveDelay) {
  return prisma.company.update({ where: { id: companyId }, data: { autoArchiveDelay } });
}

export function getOrCreatePayRuleSet(companyId: string, country: string) {
  return prisma.payRuleSet.findFirst({ where: { companyId, country, isActive: true } });
}

export function upsertPayRuleSet(
  companyId: string,
  country: string,
  data: { overtimeMultiplier: number; sundayMultiplier: number; holidayMultiplier: number },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.payRuleSet.findFirst({ where: { companyId, country, isActive: true } });
    if (existing) {
      return tx.payRuleSet.update({ where: { id: existing.id }, data });
    }
    return tx.payRuleSet.create({
      data: { companyId, country, name: `Regla ${country}`, ...data },
    });
  });
}

export function listHolidays(companyId: string, country: string) {
  return prisma.holiday.findMany({ where: { companyId, country }, orderBy: { date: "asc" } });
}

export function createHoliday(companyId: string, country: string, date: Date, name: string) {
  return prisma.holiday.create({ data: { companyId, country, date, name } });
}

export async function deleteHoliday(companyId: string, id: string) {
  const result = await prisma.holiday.deleteMany({ where: { id, companyId } });
  return result.count > 0;
}

export function getEmailConfig(companyId: string) {
  return prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPasswordEncrypted: true,
      smtpFromEmail: true,
      smtpFromName: true,
    },
  });
}

export function upsertEmailConfig(
  companyId: string,
  data: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPasswordEncrypted?: string;
    smtpFromEmail: string;
    smtpFromName?: string;
  },
) {
  return prisma.company.update({ where: { id: companyId }, data });
}
