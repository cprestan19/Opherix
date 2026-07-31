/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteImageKitFileByUrl } from "@/lib/imagekit-delete";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const MAX_REQUESTS_PER_WINDOW = 20;
const WINDOW_MS = 60 * 1000;

const bodySchema = z.object({ url: z.url(), deleteToken: z.string().min(1) });

/**
 * Público a propósito, igual que /api/imagekit/auth: el formulario de
 * postulación (sin sesión) también necesita poder limpiar la foto anterior
 * cuando el aspirante la reemplaza antes de enviar el formulario.
 * `deleteToken` es obligatorio y debe coincidir con el que se emitió al
 * autorizar la subida de ESE archivo (§ ver imagekit-auth.ts /
 * imagekit-delete.ts) — sin él, cualquiera que conociera la URL pública de
 * una foto/documento de otro tenant (ej. tomada del selector de personal en
 * /solicitar) podría borrarla sin haberla subido nunca.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`imagekit-delete:${ip}`, MAX_REQUESTS_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  await deleteImageKitFileByUrl(parsed.data.url, parsed.data.deleteToken);
  return NextResponse.json({ ok: true });
}
