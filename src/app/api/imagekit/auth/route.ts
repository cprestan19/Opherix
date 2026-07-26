/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getImageKitUploadAuth } from "@/lib/imagekit-auth";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const MAX_REQUESTS_PER_WINDOW = 20;
const WINDOW_MS = 60 * 1000;

/**
 * Endpoint público a propósito: lo consume tanto el formulario público de
 * postulación (sin sesión) como los portales autenticados para subir fotos y
 * documentos, así que no puede exigir sesión. Se limita por IP para que no
 * sirva para farmear firmas de subida masivamente (abuso de cuota ImageKit).
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`imagekit-auth:${ip}`, MAX_REQUESTS_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }, { status: 429 });
  }

  try {
    const auth = getImageKitUploadAuth();
    return NextResponse.json(auth);
  } catch {
    return NextResponse.json({ error: "ImageKit no está configurado" }, { status: 503 });
  }
}
