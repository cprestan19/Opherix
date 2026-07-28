/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getInvoicePdfBuffer, InvoiceError } from "@/services/invoice.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const companyId = await getEffectiveCompanyId();
  const { invoiceId } = await params;

  try {
    const { buffer, filename } = await getInvoicePdfBuffer(companyId, invoiceId);
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
