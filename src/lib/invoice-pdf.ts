/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoicePdfData {
  company: { name: string; taxId: string | null; phone: string | null; address: string | null };
  client: {
    businessName: string;
    taxId: string | null;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    address: string | null;
  };
  event: { title: string; startAt: Date };
  invoice: { id: string; amount: number; issuedAt: Date | null; status: string };
}

const STATUS_LABELS: Record<string, string> = {
  ISSUED: "Pendiente de cobro",
  PAID: "Cancelado",
};

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

/**
 * Comprobante de cobro sencillo (§ Pagos > Clientes "Generar factura") —
 * deliberadamente NO es una factura fiscal (no hay integración con
 * autoridades tributarias de ningún país, ver CLAUDE.md §9.1): es un
 * registro/comprobante interno para que el cliente sepa cuánto y por qué
 * debe pagar, con nota explícita de esa limitación al pie.
 */
export function buildInvoicePdf(data: InvoicePdfData): Buffer {
  const { company, client, event, invoice } = data;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(company.name, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100);
  let y = 24;
  if (company.taxId) {
    doc.text(`RUC: ${company.taxId}`, 14, y);
    y += 5;
  }
  if (company.phone) {
    doc.text(`Tel: ${company.phone}`, 14, y);
    y += 5;
  }
  if (company.address) {
    doc.text(company.address, 14, y);
    y += 5;
  }

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("COMPROBANTE DE COBRO", 196, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`N.° ${invoice.id.slice(-8).toUpperCase()}`, 196, 24, { align: "right" });
  doc.text(
    `Fecha: ${new Intl.DateTimeFormat("es").format(invoice.issuedAt ?? new Date())}`,
    196,
    29,
    { align: "right" },
  );
  doc.text(`Estado: ${STATUS_LABELS[invoice.status] ?? invoice.status}`, 196, 34, { align: "right" });

  y = Math.max(y, 34) + 10;
  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("Cliente", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(client.businessName, 14, y);
  y += 5;
  if (client.taxId) {
    doc.text(`RUC: ${client.taxId}`, 14, y);
    y += 5;
  }
  doc.text(`Contacto: ${client.contactName}`, 14, y);
  y += 5;
  doc.text(client.contactEmail + (client.contactPhone ? ` · ${client.contactPhone}` : ""), 14, y);
  y += 5;
  if (client.address) {
    doc.text(client.address, 14, y);
    y += 5;
  }

  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Fecha del evento", "Monto"]],
    body: [[`Personal para evento — ${event.title}`, new Intl.DateTimeFormat("es").format(event.startAt), currency(invoice.amount)]],
    foot: [["", "Total a cancelar", currency(invoice.amount)]],
    styles: { fontSize: 9 },
    footStyles: { fontStyle: "bold" },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    "Este comprobante es un registro interno de cobro y no constituye una factura fiscal autorizada.",
    14,
    finalY + 12,
  );

  return Buffer.from(doc.output("arraybuffer"));
}
