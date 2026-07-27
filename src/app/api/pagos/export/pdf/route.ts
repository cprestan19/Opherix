/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextRequest, NextResponse } from "next/server";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listPaymentRecords } from "@/repositories/payment.repository";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const companyId = await getEffectiveCompanyId();
  const { searchParams } = new URL(request.url);
  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");

  const records = await listPaymentRecords(
    companyId,
    periodStart ? new Date(periodStart) : undefined,
    periodEnd ? new Date(periodEnd) : undefined,
  );

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Reporte de pagos — Opherix", 14, 16);
  doc.setFontSize(10);
  doc.text(`Periodo: ${periodStart ?? "-"} a ${periodEnd ?? "-"}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Trabajador", "Asignaciones", "Bonos", "Desc.", "Total", "Estado"]],
    body: records.map((r) => [
      r.worker.user.name,
      String(r.assignmentCount),
      Number(r.bonuses).toFixed(2),
      Number(r.deductions).toFixed(2),
      Number(r.totalAmount).toFixed(2),
      r.status,
    ]),
    foot: [
      [
        "TOTAL",
        "",
        "",
        "",
        records.reduce((sum, r) => sum + Number(r.totalAmount), 0).toFixed(2),
        "",
      ],
    ],
    styles: { fontSize: 8 },
  });

  const buffer = doc.output("arraybuffer");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pagos_${periodStart ?? "todos"}.pdf"`,
    },
  });
}
