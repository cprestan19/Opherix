/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getInvoicePdfForPublicAccess, InvoiceError } from "@/services/invoice.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; eventId: string }> },
) {
  const { companySlug, eventId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Enlace no válido." }, { status: 400 });
  }

  try {
    const { buffer, filename } = await getInvoicePdfForPublicAccess(companySlug, eventId, token);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
