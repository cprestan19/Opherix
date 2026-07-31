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
import { getFinancialReport } from "@/services/financial-report.service";
import { getCompany } from "@/repositories/config.repository";
import { fetchLogoForPdf } from "@/lib/pdf-logo";
import { logAudit } from "@/lib/audit";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

const BRAND_VIOLET: [number, number, number] = [95, 60, 221];

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const companyId = await getEffectiveCompanyId();
  const { searchParams } = new URL(request.url);
  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");
  const clientId = searchParams.get("clientId") ?? undefined;
  const eventId = searchParams.get("eventId") ?? undefined;
  const workerId = searchParams.get("workerId") ?? undefined;

  const [{ rows, totals }, company] = await Promise.all([
    getFinancialReport(companyId, {
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      clientId,
      eventId,
      workerId,
    }),
    getCompany(companyId),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const logo = company.logoUrl ? await fetchLogoForPdf(company.logoUrl) : null;

  doc.setFillColor(...BRAND_VIOLET);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, "F");

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, 10, 3, 16, 16);
    } catch {
      // Logo corrupto/no soportado — el reporte sigue sin él.
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(`Reporte financiero — ${company.name}`, logo ? 30 : 10, 14);
  doc.setFontSize(9);
  doc.text(`Periodo: ${periodStart ?? "-"} a ${periodEnd ?? "-"}`, doc.internal.pageSize.getWidth() - 10, 14, {
    align: "right",
  });

  autoTable(doc, {
    startY: 28,
    head: [["Fecha", "Cliente", "Evento", "Personal", "Ingreso", "Egreso", "Margen", "Estado"]],
    body: rows.map((r) => [
      new Intl.DateTimeFormat("es").format(r.startAt),
      r.clientName,
      r.title,
      String(r.staffCount),
      r.ingreso > 0 ? currency(r.ingreso) : "—",
      r.egreso > 0 ? currency(r.egreso) : "—",
      currency(r.margen),
      STATUS_LABELS[r.status] ?? r.status,
    ]),
    foot: [["", "", "", "TOTAL", currency(totals.ingreso), currency(totals.egreso), currency(totals.margen), ""]],
    headStyles: { fillColor: BRAND_VIOLET, textColor: 255 },
    footStyles: { fillColor: [46, 27, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8.5 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(7.5);
  doc.setTextColor(140);
  doc.text(
    "Ingreso: monto facturado al cliente. Egreso: monto pagado al personal asignado a cada evento.",
    10,
    finalY + 8,
  );

  const buffer = doc.output("arraybuffer");

  await logAudit({
    companyId,
    actorId: user.id,
    action: "FINANCIAL_REPORT_EXPORTED",
    entityType: "Company",
    entityId: companyId,
    metadata: { format: "pdf", periodStart, periodEnd, clientId, eventId, workerId, rowCount: rows.length },
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-financiero_${periodStart ?? "todos"}.pdf"`,
    },
  });
}
