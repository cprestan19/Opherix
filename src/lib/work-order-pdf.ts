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
  // Cédula/pasaporte, no teléfono: el documento se entrega al Cliente (fuera
  // del tenant), y el teléfono del trabajador es un dato de contacto interno
  // que no corresponde compartir con él — la identificación en sitio se hace
  // con el número de documento, no llamando al trabajador.
  assignments: { specialty: Specialty | null; workerName: string; workerIdNumber: string | null }[];
}

// --- Template "hoja de control" (formato Excel del cliente) -----------------
// El contenido/orden de datos sigue viniendo tal cual de WorkOrderPdfData /
// BatchWorkOrderPdfData (mismos campos que ya entrega work-order.service.ts):
// esto es exclusivamente una capa de presentación sobre esos mismos datos.

const YELLOW_HEADER: [number, number, number] = [255, 216, 0];
const GROUP_BAND: [number, number, number] = [240, 240, 240];
const BLACK: [number, number, number] = [0, 0, 0];

const TABLE_HEAD = ["Nombre y Apellido", "ID (Cédula)", "Descripción", "Fecha", "Hora Entrada", "Firma", "Hora Salida", "Firma"];

// Nombre y Apellido / Descripción quedan "auto": absorben el espacio sobrante
// hasta llenar el ancho de la página (§16 — más espacio para nombre,
// descripción, fecha y firma) sin que jspdf-autotable se queje de un sobrante
// que ninguna columna de ancho fijo puede repartirse.
const TABLE_COLUMN_STYLES = {
  1: { cellWidth: 22 },
  3: { cellWidth: 28 },
  4: { cellWidth: 22 },
  5: { cellWidth: 34 },
  6: { cellWidth: 22 },
  7: { cellWidth: 34 },
};

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es", { weekday: "long" });
const MONTH_FORMATTER = new Intl.DateTimeFormat("es", { month: "long" });

/** "MARTES 29 SEPTIEMBRE" — sin año, como en la hoja de control del cliente. */
function formatWorkOrderDate(date: Date): string {
  const weekday = WEEKDAY_FORMATTER.format(date);
  const day = date.getDate().toString().padStart(2, "0");
  const month = MONTH_FORMATTER.format(date);
  return `${weekday} ${day} ${month}`.toUpperCase();
}

/** "8AM" / "2:30PM" — sin segundos, sin timezone, minutos solo si no son :00. */
function formatWorkOrderTime(date: Date): string {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return minutes === 0 ? `${hours12}${period}` : `${hours12}:${minutes.toString().padStart(2, "0")}${period}`;
}

function sortAssignmentsByName<T extends { workerName: string }>(assignments: T[]): T[] {
  return [...assignments].sort((a, b) => a.workerName.localeCompare(b.workerName));
}

function assignmentRow(
  a: { specialty: Specialty | null; workerName: string; workerIdNumber: string | null },
  dateLabel: string,
  timeIn: string,
  timeOut: string,
) {
  return [a.workerName, a.workerIdNumber ?? "", a.specialty ? specialtyLabels[a.specialty] : "", dateLabel, timeIn, "", timeOut, ""];
}

const RED: [number, number, number] = [200, 0, 0];
const LOGO_X = 14;
const LOGO_Y = 8;
const LOGO_SIZE = 38.1; // 1.5" — a pedido explícito, sin nombre de empresa al lado

/**
 * Solo el logo, sin el nombre de la empresa al lado (a pedido explícito) — el
 * título "ORDEN DE TRABAJO" se dibuja aparte, justo debajo del logo. Si la
 * empresa no tiene logo cargado, el nombre sirve de único identificador para
 * no dejar el encabezado completamente vacío.
 */
function drawCompanyHeader(doc: jsPDF, company: { name: string; logoUrl: string | null }, logo: { dataUrl: string; format: string } | null) {
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // Formato/imagen corrupta — la orden sigue sin el logo.
    }
    return;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(company.name, 14, 14);
}

function drawWorkOrderTitle(doc: jsPDF, y: number) {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...RED);
  doc.text("ORDEN DE TRABAJO", 14, y);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
}

/**
 * Orden de trabajo (§ /admin/eventos/[eventId] "Ver orden de trabajo") — se
 * entrega al Cliente por WhatsApp + correo al completar el evento (§
 * event.service.ts sendWorkOrderToClient). Template tipo "hoja de control"
 * (formato del Excel que ya usa el cliente): título, lugar/fecha del evento y
 * una tabla de 8 columnas con espacio de firma de entrada/salida por
 * trabajador — mismos datos que siempre recibió este builder (WorkOrderPdfData
 * no cambió), solo cambió la presentación.
 */
export async function buildWorkOrderPdf(data: WorkOrderPdfData): Promise<Buffer> {
  const { company, event, assignments } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });

  const logo = company.logoUrl ? await fetchLogoForPdf(company.logoUrl) : null;
  drawCompanyHeader(doc, company, logo);

  let y = logo ? LOGO_Y + LOGO_SIZE + 6 : 26;
  drawWorkOrderTitle(doc, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Lugar del Evento: ${event.address}`, 14, y);
  y += 6;
  doc.text(`Fecha del Evento: ${formatWorkOrderDate(event.startAt)}`, 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  const dateLabel = formatWorkOrderDate(event.startAt);
  const timeIn = formatWorkOrderTime(event.startAt);
  const timeOut = formatWorkOrderTime(event.endAt);
  const sortedAssignments = sortAssignmentsByName(assignments);

  autoTable(doc, {
    startY: y + 4,
    margin: { left: 14, right: 14 },
    theme: "grid",
    head: [TABLE_HEAD],
    body: sortedAssignments.map((a) => assignmentRow(a, dateLabel, timeIn, timeOut)),
    styles: {
      fontSize: 9,
      textColor: BLACK,
      lineColor: BLACK,
      lineWidth: 0.2,
      cellPadding: 2,
      valign: "middle",
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: YELLOW_HEADER,
      textColor: BLACK,
      fontStyle: "bold",
      halign: "center",
      lineColor: BLACK,
      lineWidth: 0.3,
    },
    columnStyles: TABLE_COLUMN_STYLES,
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export interface BatchWorkOrderPdfEvent {
  title: string;
  eventType: string | null;
  address: string;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  assignments: { specialty: Specialty | null; workerName: string; workerIdNumber: string | null }[];
}

export interface BatchWorkOrderPdfData {
  company: { name: string; logoUrl: string | null };
  events: BatchWorkOrderPdfEvent[];
}

// El template del lote agrega una columna "Dirección" que la orden de un solo
// evento no necesita (ahí el lugar ya va arriba de la tabla, sin ambigüedad):
// al agrupar por fecha en vez de por evento, un mismo grupo puede mezclar
// personal de direcciones distintas si el cliente tiene más de un evento el
// mismo día, y esa columna es la única forma de saber a cuál pertenece cada quien.
const BATCH_TABLE_HEAD = ["Nombre y Apellido", "ID (Cédula)", "Dirección", "Descripción", "Fecha", "Hora Entrada", "Firma", "Hora Salida", "Firma"];

const BATCH_TABLE_COLUMN_STYLES = {
  1: { cellWidth: 22 },
  2: { cellWidth: 28 },
  4: { cellWidth: 22 },
  5: { cellWidth: 34 },
  6: { cellWidth: 22 },
  7: { cellWidth: 34 },
  8: { cellWidth: 22 },
};

interface BatchAssignmentRowData {
  specialty: Specialty | null;
  workerName: string;
  workerIdNumber: string | null;
  address: string;
  timeIn: string;
  timeOut: string;
}

function batchAssignmentRow(a: BatchAssignmentRowData, dateLabel: string) {
  return [a.workerName, a.workerIdNumber ?? "", a.address, a.specialty ? specialtyLabels[a.specialty] : "", dateLabel, a.timeIn, "", a.timeOut, ""];
}

interface DateGroup {
  dateLabel: string;
  events: BatchWorkOrderPdfEvent[];
}

/**
 * Los eventos ya llegan ordenados por startAt (listEventsDetailForBatch), así
 * que agrupar solo requiere juntar los que sean consecutivos y compartan el
 * mismo dateLabel — sin volver a ordenar ni usar un Map.
 */
function groupEventsByDate(events: BatchWorkOrderPdfEvent[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const event of events) {
    const dateLabel = formatWorkOrderDate(event.startAt);
    const last = groups[groups.length - 1];
    if (last && last.dateLabel === dateLabel) {
      last.events.push(event);
    } else {
      groups.push({ dateLabel, events: [event] });
    }
  }
  return groups;
}

/**
 * Orden de trabajo consolidada de un lote de eventos creados en un mismo
 * envío (§ Event.batchId, event.service.ts sendBatchWorkOrderToClient) — mismo
 * template "hoja de control" que buildWorkOrderPdf, con los trabajadores
 * agrupados por fecha (un solo encabezado de grupo por día, aunque el cliente
 * tenga varios eventos ese mismo día — encabezado + línea gruesa entre
 * grupos, igual que el Excel del cliente) dentro de una única tabla continua.
 * Todo el personal de un mismo día se ordena junto por nombre, sin importar
 * de qué evento venga — la columna "Dirección" indica a cuál pertenece.
 * La selección/filtrado de eventos y asignaciones la sigue haciendo
 * work-order.service.ts sin cambios — esto solo consume el resultado.
 */
export async function buildBatchWorkOrderPdf(data: BatchWorkOrderPdfData): Promise<Buffer> {
  const { company, events } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });

  const logo = company.logoUrl ? await fetchLogoForPdf(company.logoUrl) : null;
  drawCompanyHeader(doc, company, logo);

  const y = logo ? LOGO_Y + LOGO_SIZE + 6 : 26;
  drawWorkOrderTitle(doc, y);
  let headerY = y + 8;

  // events ya viene ordenado por startAt (listEventsDetailForBatch) — el
  // primero y el último bastan para el rango sin volver a ordenar.
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const firstDateLabel = formatWorkOrderDate(firstEvent.startAt);
  const lastDateLabel = formatWorkOrderDate(lastEvent.startAt);
  const eventDateLabel = firstDateLabel === lastDateLabel ? firstDateLabel : `${firstDateLabel} — ${lastDateLabel}`;

  const uniqueAddresses = new Set(events.map((e) => e.address));
  const eventPlaceLabel = uniqueAddresses.size === 1 ? firstEvent.address : `${uniqueAddresses.size} lugares distintos (ver detalle por fecha)`;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Lugar del Evento: ${eventPlaceLabel}`, 14, headerY);
  headerY += 6;
  doc.text(`Fecha del Evento: ${eventDateLabel}`, 14, headerY);
  doc.setFont("helvetica", "normal");
  headerY += 6;

  const tableStartY = headerY + 4;

  const groupHeaderRow = (label: string, isFirst: boolean): RowInput => [
    {
      content: label,
      colSpan: 9,
      styles: {
        fillColor: GROUP_BAND,
        textColor: BLACK,
        fontStyle: "bold",
        halign: "left",
        lineColor: BLACK,
        lineWidth: { top: isFirst ? 0.3 : 1.2, right: 0.2, bottom: 0.3, left: 0.2 },
      },
    } satisfies CellDef,
  ];

  const emptyGroupRow: RowInput = [
    { content: "Sin personal asignado", colSpan: 9, styles: { textColor: BLACK, halign: "left" } } satisfies CellDef,
  ];

  const body: RowInput[] = [];
  const dateGroups = groupEventsByDate(events);
  dateGroups.forEach((group, index) => {
    body.push(groupHeaderRow(group.dateLabel, index === 0));

    const rows = group.events.flatMap((event) =>
      event.assignments.map((a) => ({
        ...a,
        address: event.address,
        timeIn: formatWorkOrderTime(event.startAt),
        timeOut: formatWorkOrderTime(event.endAt),
      })),
    );
    const sortedRows = sortAssignmentsByName(rows);

    if (sortedRows.length === 0) {
      body.push(emptyGroupRow);
    } else {
      for (const r of sortedRows) {
        body.push(batchAssignmentRow(r, group.dateLabel));
      }
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14 },
    theme: "grid",
    head: [BATCH_TABLE_HEAD],
    body,
    styles: {
      fontSize: 9,
      textColor: BLACK,
      lineColor: BLACK,
      lineWidth: 0.2,
      cellPadding: 2,
      valign: "middle",
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: YELLOW_HEADER,
      textColor: BLACK,
      fontStyle: "bold",
      halign: "center",
      lineColor: BLACK,
      lineWidth: 0.3,
    },
    columnStyles: BATCH_TABLE_COLUMN_STYLES,
  });

  return Buffer.from(doc.output("arraybuffer"));
}
