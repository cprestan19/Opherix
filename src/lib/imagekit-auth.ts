/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";
import { signImageKitDeleteToken } from "@/lib/imagekit-delete";

/**
 * Genera los parámetros de autenticación para subida directa desde el cliente
 * (protocolo documentado de ImageKit: signature = HMAC-SHA1(token + expire)).
 * El SDK @imagekit/nodejs v7 aún no expone un helper de alto nivel para esto,
 * así que se implementa siguiendo el esquema estable documentado por ImageKit.
 *
 * También pre-asigna el nombre final del archivo (en vez de dejar que
 * `useUniqueFileName` de ImageKit lo randomice) para poder firmar de una vez
 * un `deleteToken` atado a esa ruta exacta — es lo único que autoriza borrar
 * ese archivo después vía /api/imagekit/delete (§ ver imagekit-delete.ts).
 * Conserva la extensión del archivo original (si se indica) para que
 * ImageKit siga sirviendo el Content-Type correcto — antes el nombre siempre
 * traía la extensión real (`file.name`); solo se randomiza el nombre base.
 */
export function getImageKitUploadAuth(folder: string, originalFileName?: string) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY no está configurada");
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutos
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  const extMatch = originalFileName?.match(/\.[a-zA-Z0-9]+$/);
  const fileName = `${crypto.randomUUID()}${extMatch?.[0] ?? ""}`;
  const normalizedFolder = folder.startsWith("/") ? folder : `/${folder}`;
  const filePath = `${normalizedFolder}/${fileName}`;
  const deleteToken = signImageKitDeleteToken(filePath);

  return {
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? "",
    fileName,
    deleteToken,
  };
}
