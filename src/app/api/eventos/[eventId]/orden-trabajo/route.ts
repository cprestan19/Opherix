/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getWorkOrderPdf, WorkOrderError } from "@/services/work-order.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR" && user.role !== "VIEWER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { eventId } = await params;
  const companyId = await getEffectiveCompanyId();

  try {
    const { buffer, filename } = await getWorkOrderPdf(companyId, eventId);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof WorkOrderError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
