/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getFinancialReport } from "@/services/financial-report.service";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

// Violeta de marca (§ CLAUDE.md §3, Radix violet-9/violet-12) — ARGB porque
// exceljs no acepta hex de 6 dígitos solo, necesita el canal alpha.
const BRAND_VIOLET = "FF5F3CDD";
const BRAND_VIOLET_DARK = "FF2E1B6B";
const LIGHT_ROW = "FFF8FAFC";

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

  const { rows, totals } = await getFinancialReport(companyId, {
    periodStart: periodStart ? new Date(periodStart) : undefined,
    periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    clientId,
    eventId,
    workerId,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Opherix";
  const sheet = workbook.addWorksheet("Reporte financiero", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Fecha", key: "date", width: 14 },
    { header: "Cliente", key: "client", width: 26 },
    { header: "Evento", key: "event", width: 28 },
    { header: "Personal", key: "staffCount", width: 10 },
    { header: "Ingreso", key: "ingreso", width: 14 },
    { header: "Egreso", key: "egreso", width: 14 },
    { header: "Margen", key: "margen", width: 14 },
    { header: "Estado", key: "status", width: 14 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_VIOLET } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  headerRow.height = 22;

  rows.forEach((row, i) => {
    const excelRow = sheet.addRow({
      date: row.startAt,
      client: row.clientName,
      event: row.title,
      staffCount: row.staffCount,
      ingreso: row.ingreso,
      egreso: row.egreso,
      margen: row.margen,
      status: STATUS_LABELS[row.status] ?? row.status,
    });

    excelRow.getCell("date").numFmt = "dd/mm/yyyy";
    excelRow.getCell("ingreso").numFmt = '"$"#,##0.00';
    excelRow.getCell("egreso").numFmt = '"$"#,##0.00';
    excelRow.getCell("margen").numFmt = '"$"#,##0.00';
    excelRow.getCell("ingreso").font = { color: { argb: "FF16803D" } };
    excelRow.getCell("egreso").font = { color: { argb: "FFDC2626" } };
    excelRow.getCell("margen").font = { bold: true, color: { argb: row.margen >= 0 ? "FF0F172A" : "FFDC2626" } };

    if (i % 2 === 1) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_ROW } };
      });
    }
  });

  const totalRow = sheet.addRow({
    client: "TOTAL",
    ingreso: totals.ingreso,
    egreso: totals.egreso,
    margen: totals.margen,
  });
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_VIOLET_DARK } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  totalRow.getCell("ingreso").numFmt = '"$"#,##0.00';
  totalRow.getCell("egreso").numFmt = '"$"#,##0.00';
  totalRow.getCell("margen").numFmt = '"$"#,##0.00';

  sheet.autoFilter = { from: "A1", to: "H1" };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-financiero_${periodStart ?? "todos"}.xlsx"`,
    },
  });
}
