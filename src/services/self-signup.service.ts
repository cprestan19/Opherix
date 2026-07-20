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
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { logAudit } from "@/lib/audit";

/**
 * Auto-aprovisionamiento para registro con Google (§ self-service signup):
 * primer login de un correo que no existe en `User` crea su propia empresa
 * (tenant) + cuenta ADMIN, sin intervención de un admin de plataforma.
 * La contraseña se genera al azar e inutilizable a propósito — esta cuenta
 * solo puede entrar vía Google.
 */
export async function provisionCompanyForGoogleUser(email: string, name: string, image?: string) {
  const baseSlug = slugify(name || email.split("@")[0]) || "empresa";
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const unusablePassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(unusablePassword, 12);

  const company = await prisma.company.create({
    data: {
      name: name || email.split("@")[0],
      slug,
      country: "PA",
      billingStatus: "TRIAL",
      users: {
        create: {
          email: email.toLowerCase(),
          passwordHash,
          name: name || email.split("@")[0],
          image,
          role: "ADMIN",
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      },
    },
    include: { users: true },
  });

  await logAudit({
    companyId: company.id,
    actorId: company.users[0].id,
    action: "COMPANY_SELF_SIGNUP",
    entityType: "Company",
    entityId: company.id,
    metadata: { via: "google" },
  });

  return company.users[0];
}
