/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchLogoForPdf } from "@/lib/pdf-logo";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { formatTime12h } from "@/utils/date";
import type { Specialty } from "@/generated/prisma/enums";

export interface WorkOrderPdfData {
  company: { name: string; logoUrl: string | null };
  event: {
    title: string;
    eventType: string | null;
    address: string;
    startAt: Date;
    endAt: Date;
    notes: string | null;
  };
  // Contacto en sitio (el del Cliente que solicitó el evento) — a diferencia
  // del resto de datos del cliente (razón social, RUC, correo), el nombre y
  // teléfono de contacto sí son útiles operativamente para el personal.
  contact: { name: string; phone: string | null };
  assignments: { specialty: Specialty | null; workerName: string; workerPhone: string | null }[];
}

/**
 * Orden de trabajo (§ /admin/eventos/[eventId] "Orden de trabajo") — se
 * entrega al Cliente (igual que la cotización/factura, ver "Enviar por
 * WhatsApp" en getWorkOrderWhatsAppLink de work-order.service.ts): dónde,
 * cuándo, contacto en sitio, y quién del personal fue asignado con su
 * teléfono, para que el Cliente sepa exactamente a quién esperar.
 */
export async function buildWorkOrderPdf(data: WorkOrderPdfData): Promise<Buffer> {
  const { company, event, contact, assignments } = data;
  const doc = new jsPDF();

  const logo = company.logoUrl ? await fetchLogoForPdf(company.logoUrl) : null;
  const textStartX = logo ? 38 : 14;

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, 14, 12, 20, 20);
    } catch {
      // Formato/imagen corrupta — la orden sigue sin el logo.
    }
  }

  doc.setFontSize(16);
  doc.text(company.name, textStartX, 18);
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("ORDEN DE TRABAJO", 196, 18, { align: "right" });

  let y = Math.max(logo ? 34 : 26, 26);
  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text(event.title, 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(80);
  const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium" });
  if (event.eventType) {
    doc.text(`Tipo: ${event.eventType}`, 14, y);
    y += 5;
  }
  doc.text(`Ubicación: ${event.address}`, 14, y);
  y += 5;
  doc.text(
    `Horario: ${dateFormatter.format(event.startAt)} ${formatTime12h(event.startAt)} – ${dateFormatter.format(event.endAt)} ${formatTime12h(event.endAt)}`,
    14,
    y,
  );
  y += 5;
  doc.text(`Contacto en sitio: ${contact.name}${contact.phone ? ` · ${contact.phone}` : ""}`, 14, y);
  y += 5;
  if (event.notes) {
    const noteLines = doc.splitTextToSize(`Notas: ${event.notes}`, 182);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5;
  }

  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Personal asignado", 14, y);
  y += 4;

  const sortedAssignments = [...assignments].sort((a, b) => {
    const labelA = a.specialty ? specialtyLabels[a.specialty] : "";
    const labelB = b.specialty ? specialtyLabels[b.specialty] : "";
    return labelA.localeCompare(labelB) || a.workerName.localeCompare(b.workerName);
  });

  // Hoy no existe un horario por trabajador distinto del horario general del
  // evento (WorkerAssignment no tiene startAt/endAt propio) — se repite el
  // mismo horario del evento en cada línea, a pedido explícito para que el
  // documento impreso no obligue a mirar el encabezado.
  const startTime = formatTime12h(event.startAt);
  const endTime = formatTime12h(event.endAt);

  autoTable(doc, {
    startY: y + 4,
    head: [["Especialidad", "Nombre", "Teléfono", "Hora inicio", "Hora fin"]],
    body: sortedAssignments.map((a) => [
      a.specialty ? specialtyLabels[a.specialty] : "—",
      a.workerName,
      a.workerPhone ?? "—",
      startTime,
      endTime,
    ]),
    styles: { fontSize: 9 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`Total de personal asignado: ${assignments.length}`, 14, finalY + 10);

  return Buffer.from(doc.output("arraybuffer"));
}
