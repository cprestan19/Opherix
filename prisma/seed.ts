import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_ADMIN_EMAIL = "admin@demo.eventstaff.local";
const DEMO_ADMIN_PASSWORD = "Admin123!";

const PLATFORM_ADMIN_EMAIL = "owner@operix.app";

async function main() {
  const existingPlatformAdmin = await prisma.platformAdmin.findUnique({
    where: { email: PLATFORM_ADMIN_EMAIL },
  });

  let platformAdminPassword: string | null = null;
  if (!existingPlatformAdmin) {
    platformAdminPassword = crypto.randomBytes(9).toString("base64url");
    const platformPasswordHash = await bcrypt.hash(platformAdminPassword, 12);
    await prisma.platformAdmin.create({
      data: {
        email: PLATFORM_ADMIN_EMAIL,
        passwordHash: platformPasswordHash,
        name: "Operix Owner",
      },
    });
  }

  const company = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Staffing Co.",
      slug: "demo",
      country: "PA",
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: {},
    create: {
      companyId: company.id,
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      name: "Admin Demo",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.payRuleSet.upsert({
    where: { id: `${company.id}-default` },
    update: {},
    create: {
      id: `${company.id}-default`,
      companyId: company.id,
      country: "PA",
      name: "Regla estándar Panamá",
    },
  }).catch(async () => {
    // upsert por id sintético falla si ya no calza; fallback a create simple si no existe ninguna regla activa
    const existing = await prisma.payRuleSet.findFirst({ where: { companyId: company.id } });
    if (!existing) {
      await prisma.payRuleSet.create({
        data: { companyId: company.id, country: "PA", name: "Regla estándar Panamá" },
      });
    }
  });

  console.log("Seed completo.");
  console.log(`Empresa demo: ${company.name} (slug: ${company.slug})`);
  console.log(`Admin demo: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`Enlace de postulación: /postulate/${company.slug}`);
  if (platformAdminPassword) {
    console.log(`Platform admin (dueño de Operix): ${PLATFORM_ADMIN_EMAIL} / ${platformAdminPassword}`);
  } else {
    console.log(`Platform admin ya existía: ${PLATFORM_ADMIN_EMAIL} (contraseña sin cambios)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
