/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { fcmToken: parsed.data.token } });
  return NextResponse.json({ ok: true });
}
