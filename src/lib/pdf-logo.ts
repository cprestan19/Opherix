/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

const LOGO_FORMAT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/webp": "WEBP",
};

/**
 * Descarga el logo de ImageKit y lo convierte a base64 para jsPDF — en el
 * servidor no hay `Image`/DOM, así que addImage necesita los bytes ya
 * resueltos. Si falla (red, formato no soportado como SVG), se omite en
 * silencio: el logo es un detalle visual, nunca debe romper la generación
 * del PDF (comprobante o reporte).
 */
export async function fetchLogoForPdf(logoUrl: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    const format = LOGO_FORMAT_BY_CONTENT_TYPE[contentType];
    if (!format) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return { dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`, format };
  } catch {
    return null;
  }
}
