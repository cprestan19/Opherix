/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
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

/**
 * A diferencia de las Server Actions (que Next.js protege automáticamente
 * comparando el header Origin contra el host), esta es una API route plana
 * y depende solo de la cookie de sesión — sin este chequeo, un sitio externo
 * podría forzar a un usuario logueado a registrar un fcmToken del atacante
 * (CSRF) y así secuestrar sus notificaciones push futuras.
 */
function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const user = await getCurrentUser();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { fcmToken: parsed.data.token } });
  return NextResponse.json({ ok: true });
}
