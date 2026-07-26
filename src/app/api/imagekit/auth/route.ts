/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextResponse } from "next/server";
import { getImageKitUploadAuth } from "@/lib/imagekit-auth";

/**
 * Endpoint público a propósito: lo consume tanto el formulario público de
 * postulación (sin sesión) como los portales autenticados para subir fotos y
 * documentos. Ver CLAUDE.md — pendiente de rate limiting anti-abuso en Fase 12.
 */
export async function GET() {
  try {
    const auth = getImageKitUploadAuth();
    return NextResponse.json(auth);
  } catch {
    return NextResponse.json({ error: "ImageKit no está configurado" }, { status: 503 });
  }
}
