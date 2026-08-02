/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBatchQuotePdfForClient, QuoteError } from "@/services/quote.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; token: string }> },
) {
  const { companySlug, token } = await params;
  const eventIds = request.nextUrl.searchParams.get("eventos")?.split(",").filter(Boolean) ?? [];

  try {
    const { buffer, filename } = await getBatchQuotePdfForClient(companySlug, token, eventIds);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
