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

// El logo se dibuja en el PDF a 20x20mm (~236px a 300dpi) — pedirle a
// ImageKit el original tal cual (a veces varios MB) infla cada cotización/
// orden de trabajo a ~10MB por un logo que ocupa una esquina diminuta. La
// transformación por query param (§ https://imagekit.io/docs, "tr=") reduce
// esto a unos pocos KB sin tocar el archivo fuente en ImageKit.
const LOGO_TRANSFORM = "w-240,h-240,c-at_max,q-75";

function withImageKitTransform(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("imagekit.io")) return url;
    parsed.searchParams.set("tr", LOGO_TRANSFORM);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Descarga el logo de ImageKit y lo convierte a base64 para jsPDF — en el
 * servidor no hay `Image`/DOM, así que addImage necesita los bytes ya
 * resueltos. Si falla (red, formato no soportado como SVG), se omite en
 * silencio: el logo es un detalle visual, nunca debe romper la generación
 * del PDF (comprobante o reporte).
 */
export async function fetchLogoForPdf(logoUrl: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const response = await fetch(withImageKitTransform(logoUrl));
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
