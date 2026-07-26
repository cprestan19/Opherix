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

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pagos");
  sheet.columns = [
    { header: "Trabajador", key: "worker", width: 28 },
    { header: "Periodo inicio", key: "periodStart", width: 14 },
    { header: "Periodo fin", key: "periodEnd", width: 14 },
    { header: "Horas regulares", key: "regularHours", width: 16 },
    { header: "Horas extra", key: "overtimeHours", width: 14 },
    { header: "Horas domingo", key: "sundayHours", width: 14 },
    { header: "Horas feriado", key: "holidayHours", width: 14 },
    { header: "Bonos", key: "bonuses", width: 10 },
    { header: "Descuentos", key: "deductions", width: 12 },
    { header: "Total", key: "totalAmount", width: 12 },
    { header: "Estado", key: "status", width: 12 },
    { header: "Método de pago", key: "paymentMethod", width: 16 },
  ];

  for (const record of records) {
    sheet.addRow({
      worker: record.worker.user.name,
      periodStart: record.periodStart.toISOString().slice(0, 10),
      periodEnd: record.periodEnd.toISOString().slice(0, 10),
      regularHours: Number(record.regularHours),
      overtimeHours: Number(record.overtimeHours),
      sundayHours: Number(record.sundayHours),
      holidayHours: Number(record.holidayHours),
      bonuses: Number(record.bonuses),
      deductions: Number(record.deductions),
      totalAmount: Number(record.totalAmount),
      status: record.status,
      paymentMethod: record.paymentMethod ?? "",
    });
  }

  const totalRow = sheet.addRow({
    worker: "TOTAL",
    totalAmount: records.reduce((sum, r) => sum + Number(r.totalAmount), 0),
  });
  totalRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pagos_${periodStart ?? "todos"}.xlsx"`,
    },
  });
}
