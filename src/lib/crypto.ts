/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Cifrado simétrico para secretos por tenant que deben poder recuperarse en
 * texto plano al momento de usarlos (ej. contraseña de aplicación SMTP en
 * Company.smtpPasswordEncrypted) — a diferencia de contraseñas de usuario,
 * que se hashean con bcrypt y nunca se recuperan. AES-256-GCM con
 * ENCRYPTION_KEY (32 bytes en base64) desde variables de entorno.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY no configurada.");
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) throw new Error("ENCRYPTION_KEY debe ser 32 bytes en base64.");
  return buffer;
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
