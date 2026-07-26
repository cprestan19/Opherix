/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archiveEventsForCompany } from "@/services/event.service";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

/**
 * Disparado diariamente por Vercel Cron (ver vercel.json). Protegido con
 * CRON_SECRET para que no sea invocable públicamente (§9.4).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    where: { isActive: true, autoArchiveDelay: { not: "OFF" } },
    select: { id: true },
  });

  let totalArchived = 0;
  for (const company of companies) {
    const { archived } = await archiveEventsForCompany(company.id);
    totalArchived += archived;
  }

  return NextResponse.json({ ok: true, companiesChecked: companies.length, archived: totalArchived });
}
