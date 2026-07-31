/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";

// Carpetas donde la app sube fotos/documentos reemplazables — cualquier URL
// fuera de estas nunca se borra, aunque alguien la pase al endpoint público
// (protege assets fijos como el logo de marca en /brand).
const DELETABLE_FOLDER_PREFIXES = ["/applicants", "/workers", "/checkins", "/documents", "/staff", "/clients"];

export function extractImageKitFilePath(url: string): string | null {
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint || !url.startsWith(urlEndpoint)) return null;

  const filePath = url.slice(urlEndpoint.length).split("?")[0];
  if (!DELETABLE_FOLDER_PREFIXES.some((prefix) => filePath.startsWith(prefix))) return null;
  return filePath;
}

/**
 * `/api/imagekit/delete` es público (lo usa también el formulario de
 * postulación, sin sesión) — sin este token, cualquiera que conociera la URL
 * pública de una foto/documento de OTRO tenant (ej. tomada del selector de
 * personal en /solicitar) podría borrarla llamando al endpoint directamente,
 * sin haberla subido nunca. El token se firma server-side cuando se emite la
 * autorización de subida (`getImageKitUploadAuth`) para esa ruta exacta, y
 * solo permite borrar ESE archivo — nunca uno arbitrario. Reemplazar una foto
 * ya existente (cargada desde BD, sin token en memoria) simplemente no
 * dispara la limpieza, igual que cualquier otro fallo tolerado aquí.
 */
export function signImageKitDeleteToken(filePath: string): string {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY ?? "";
  return crypto.createHmac("sha256", privateKey).update(`imagekit-delete:${filePath}`).digest("hex");
}

function verifyImageKitDeleteToken(filePath: string, token: string): boolean {
  const expected = Buffer.from(signImageKitDeleteToken(filePath), "hex");
  const actual = Buffer.from(token, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * Elimina un archivo de ImageKit a partir de su URL pública — se usa cuando
 * una foto/documento se reemplaza por uno nuevo, para no acumular archivos
 * huérfanos. La API de subida randomiza el nombre (`useUniqueFileName`), así
 * que no hay forma de derivar el fileId de la URL: hay que buscarlo por
 * carpeta + nombre exacto antes de poder borrarlo.
 *
 * `token` debe ser el `deleteToken` que devolvió `getImageKitUploadAuth` al
 * emitir la autorización de subida de ESTE archivo — nunca se borra sin él.
 *
 * Nunca lanza — un fallo de limpieza no debe romper el flujo de reemplazo,
 * que ya subió con éxito el archivo nuevo.
 */
export async function deleteImageKitFileByUrl(url: string, token: string): Promise<void> {
  const filePath = extractImageKitFilePath(url);
  if (!filePath) return;
  if (!token || !verifyImageKitDeleteToken(filePath, token)) return;

  await deleteImageKitFileByPath(filePath);
}

/**
 * Para llamadas server-side que ya pasaron su propia verificación de
 * pertenencia (ej. `assertDocumentInCompany` antes de borrar un documento) —
 * se salta el `deleteToken` público porque el caller ya es de confianza,
 * a diferencia de `deleteImageKitFileByUrl`, pensada para el endpoint
 * público `/api/imagekit/delete`.
 */
export async function deleteImageKitFileByUrlAuthorized(url: string): Promise<void> {
  const filePath = extractImageKitFilePath(url);
  if (!filePath) return;

  await deleteImageKitFileByPath(filePath);
}

async function deleteImageKitFileByPath(filePath: string): Promise<void> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return;

  try {
    const lastSlash = filePath.lastIndexOf("/");
    const folder = filePath.slice(0, lastSlash) || "/";
    const fileName = filePath.slice(lastSlash + 1);

    const auth = Buffer.from(`${privateKey}:`).toString("base64");
    const searchQuery = encodeURIComponent(`name="${fileName}"`);
    const listRes = await fetch(
      `https://api.imagekit.io/v1/files?path=${encodeURIComponent(folder)}&searchQuery=${searchQuery}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!listRes.ok) return;

    const files: Array<{ fileId: string; filePath: string }> = await listRes.json();
    const match = files.find((f) => f.filePath === filePath);
    if (!match) return;

    await fetch(`https://api.imagekit.io/v1/files/${match.fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
  } catch (error) {
    console.error("[imagekit-delete] failed to delete old file", error);
  }
}
