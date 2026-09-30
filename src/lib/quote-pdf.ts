/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CellDef, RowInput } from "jspdf-autotable";
import { fetchLogoForPdf } from "@/lib/pdf-logo";
import { specialtyLabels } from "@/lib/validations/worker-application";
import type { ClientChargeEstimate } from "@/lib/pricing/estimate-client-charge";

export interface QuotePdfEvent {
  title: string;
  address: string;
  startAt: Date;
  estimate: ClientChargeEstimate;
}

export interface QuotePdfData {
  company: { name: string; taxId: string | null; phone: string | null; address: string | null; logoUrl: string | null };
  client: {
    businessName: string;
    taxId: string | null;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    address: string | null;
  };
  generatedAt: Date;
  events: QuotePdfEvent[];
  grandTotal: number;
  anyMissingRate: boolean;
}

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

const DATE_BAND: [number, number, number] = [240, 240, 240];

const DATE_HEADING_FORMATTER = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Miércoles, 30 de septiembre de 2026" — encabezado de la banda de fecha. */
function formatQuoteDateHeading(date: Date): string {
  const label = DATE_HEADING_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface QuoteDateGroup {
  dateLabel: string;
  events: QuotePdfEvent[];
}

/**
 * Igual que `groupEventsByDate` en work-order-pdf.ts: los eventos ya llegan
 * ordenados por startAt (listEventsForQuote/listEventsForClientQuote), así
 * que agrupar solo requiere juntar los consecutivos que compartan fecha.
 */
function groupEventsByDate(events: QuotePdfEvent[]): QuoteDateGroup[] {
  const groups: QuoteDateGroup[] = [];
  for (const event of events) {
    const dateLabel = formatQuoteDateHeading(event.startAt);
    const last = groups[groups.length - 1];
    if (last && last.dateLabel === dateLabel) {
      last.events.push(event);
    } else {
      groups.push({ dateLabel, events: [event] });
    }
  }
  return groups;
}

function dateBandRow(label: string): RowInput {
  return [
    {
      content: label,
      colSpan: 4,
      styles: { fillColor: DATE_BAND, textColor: 0, fontStyle: "bold", halign: "left" },
    } satisfies CellDef,
  ];
}

/**
 * Cotización del lote de eventos que el Cliente acaba de enviar desde su
 * enlace único (§ /solicitar/[companySlug]/cliente/[token]) — a diferencia
 * del comprobante de cobro (`buildInvoicePdf`, que emite el Administrador
 * manualmente después de asignar personal), esta se genera al instante con
 * las tarifas por especialidad ya configuradas para ese cliente sobre lo
 * SOLICITADO, nunca lo asignado — por eso siempre lleva la nota de estimado.
 */
export async function buildQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const { company, client, generatedAt, events, grandTotal, anyMissingRate } = data;
  const doc = new jsPDF();

  const logo = company.logoUrl ? await fetchLogoForPdf(company.logoUrl) : null;
  const textStartX = logo ? 38 : 14;

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, 14, 12, 20, 20);
    } catch {
      // Formato/imagen corrupta — la cotización sigue sin el logo.
    }
  }

  doc.setFontSize(16);
  doc.text(company.name, textStartX, 18);
  doc.setFontSize(9);
  doc.setTextColor(100);
  let y = 24;
  if (company.taxId) {
    doc.text(`RUC: ${company.taxId}`, textStartX, y);
    y += 5;
  }
  if (company.phone) {
    doc.text(`Tel: ${company.phone}`, textStartX, y);
    y += 5;
  }
  if (company.address) {
    doc.text(company.address, textStartX, y);
    y += 5;
  }

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("COTIZACIÓN", 196, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Intl.DateTimeFormat("es").format(generatedAt)}`, 196, 24, { align: "right" });
  doc.text(
    `${events.length} evento${events.length === 1 ? "" : "s"}`,
    196,
    29,
    { align: "right" },
  );

  y = Math.max(y, 29, logo ? 34 : 0) + 10;
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

  y += 4;

  // Una sola tabla continua para todo el lote, con una fila-banda por fecha
  // en vez de un bloque título+tabla (con head/foot propio) por evento —
  // mismo patrón que `buildBatchWorkOrderPdf` en work-order-pdf.ts para
  // evitar que la cotización crezca linealmente con la cantidad de eventos.
  const body: RowInput[] = [];
  for (const group of groupEventsByDate(events)) {
    body.push(dateBandRow(group.dateLabel));
    for (const event of group.events) {
      const eventLabel = `${event.title}\n${event.address}`;
      for (const row of event.estimate.breakdown) {
        body.push([
          eventLabel,
          `${specialtyLabels[row.specialty]} × ${row.quantity}`,
          row.chargeToClient !== null ? currency(row.chargeToClient) : "—",
          row.chargeToClient !== null ? currency(row.subtotal) : "A confirmar",
        ]);
      }
    }
  }

  autoTable(doc, {
    startY: y,
    head: [["Evento", "Personal solicitado", "Tarifa unitaria", "Subtotal"]],
    body,
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Gran total estimado", 14, y);
  doc.text(currency(grandTotal), 196, y, { align: "right" });
  y += 10;

  if (anyMissingRate) {
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      "Las líneas marcadas \"A confirmar\" no tienen tarifa configurada todavía y no suman al gran total.",
      14,
      y,
    );
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    "Esta cotización es un estimado con base en el personal solicitado — el monto final puede variar",
    14,
    y,
  );
  doc.text("según el personal que finalmente se asigne a cada evento.", 14, y + 4);

  return Buffer.from(doc.output("arraybuffer"));
}
