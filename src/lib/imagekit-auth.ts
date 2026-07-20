/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";

/**
 * Genera los parámetros de autenticación para subida directa desde el cliente
 * (protocolo documentado de ImageKit: signature = HMAC-SHA1(token + expire)).
 * El SDK @imagekit/nodejs v7 aún no expone un helper de alto nivel para esto,
 * así que se implementa siguiendo el esquema estable documentado por ImageKit.
 */
export function getImageKitUploadAuth() {
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

  return {
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? "",
  };
}
