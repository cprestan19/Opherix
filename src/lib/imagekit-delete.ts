/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";

// Carpetas donde la app sube fotos/documentos reemplazables — cualquier URL
// fuera de estas nunca se borra, aunque alguien la pase al endpoint público
// (protege assets fijos como el logo de marca en /brand).
const DELETABLE_FOLDER_PREFIXES = ["/applicants", "/workers", "/checkins", "/documents", "/staff", "/clients"];

function extractFilePath(url: string): string | null {
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint || !url.startsWith(urlEndpoint)) return null;

  const filePath = url.slice(urlEndpoint.length).split("?")[0];
  if (!DELETABLE_FOLDER_PREFIXES.some((prefix) => filePath.startsWith(prefix))) return null;
  return filePath;
}

/**
 * Elimina un archivo de ImageKit a partir de su URL pública — se usa cuando
 * una foto/documento se reemplaza por uno nuevo, para no acumular archivos
 * huérfanos. La API de subida randomiza el nombre (`useUniqueFileName`), así
 * que no hay forma de derivar el fileId de la URL: hay que buscarlo por
 * carpeta + nombre exacto antes de poder borrarlo.
 *
 * Nunca lanza — un fallo de limpieza no debe romper el flujo de reemplazo,
 * que ya subió con éxito el archivo nuevo.
 */
export async function deleteImageKitFileByUrl(url: string): Promise<void> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return;

  const filePath = extractFilePath(url);
  if (!filePath) return;

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
