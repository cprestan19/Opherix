/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import bcrypt from "bcryptjs";
import * as platformRepo from "@/repositories/platform.repository";
import { findUserByEmail } from "@/repositories/worker.repository";
import type { CreateCompanyInput } from "@/lib/validations/platform";

export class PlatformError extends Error {}

export async function listCompanies() {
  return platformRepo.listCompanies();
}

export async function listCrossTenantActivity() {
  return platformRepo.listCrossTenantActivity();
}

export async function listPlatformAuditLog() {
  return platformRepo.listPlatformAuditLog();
}

export async function getPlatformStats() {
  const [totalCompanies, activeCompanies, totalWorkers, totalEvents] =
    await platformRepo.getPlatformStats();
  return { totalCompanies, activeCompanies, totalWorkers, totalEvents };
}

export async function createCompany(input: CreateCompanyInput) {
  const existingSlug = await platformRepo.findCompanyBySlug(input.slug);
  if (existingSlug) {
    throw new PlatformError("Ya existe una empresa con ese identificador (slug).");
  }

  const existingUser = await findUserByEmail(input.adminEmail);
  if (existingUser) {
    throw new PlatformError("Ya existe una cuenta con este correo.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return platformRepo.createCompanyWithAdmin({
    name: input.name,
    slug: input.slug,
    country: input.country,
    adminName: input.adminName,
    adminEmail: input.adminEmail,
    passwordHash,
  });
}

export async function setCompanyActive(companyId: string, isActive: boolean) {
  return platformRepo.setCompanyActive(companyId, isActive);
}

/**
 * Borrado REAL y permanente de una empresa (tenant) y toda su data en
 * cascada — usuarios, trabajadores, clientes, eventos, pagos, documentos y
 * auditoría de esa empresa desaparecen para siempre. Decisión explícita del
 * usuario de romper la regla general de "nunca borrado físico" (CLAUDE.md
 * §4) específicamente para este flujo de plataforma. Queda un registro en
 * PlatformAuditLog (tabla sin FK a Company, sobrevive al borrado) como único
 * rastro de que esto ocurrió.
 */
export async function deleteCompany(
  companyId: string,
  confirmName: string,
  actor: { id: string; email: string },
) {
  const company = await platformRepo.findCompanyById(companyId);
  if (!company) throw new PlatformError("Empresa no encontrada.");

  if (confirmName.trim() !== company.name) {
    throw new PlatformError("El nombre no coincide. Escribe el nombre exacto de la empresa para confirmar.");
  }

  await platformRepo.createPlatformAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "COMPANY_DELETED",
    companyId: company.id,
    companyName: company.name,
    metadata: { slug: company.slug, country: company.country },
  });

  await platformRepo.deleteCompany(companyId);
}

export async function listPlatformAdmins() {
  return platformRepo.listPlatformAdmins();
}

export async function createPlatformAdmin(input: { name: string; email: string; password: string }) {
  const existing = await platformRepo.findPlatformAdminByEmail(input.email);
  if (existing) {
    throw new PlatformError("Ya existe un admin de plataforma con este correo.");
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  return platformRepo.createPlatformAdmin({ name: input.name, email: input.email, passwordHash });
}

export async function removePlatformAdmin(adminId: string) {
  const total = await platformRepo.countPlatformAdmins();
  if (total <= 1) {
    throw new PlatformError("No puedes eliminar al último admin de plataforma.");
  }
  await platformRepo.deletePlatformAdmin(adminId);
}
