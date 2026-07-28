/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Normaliza errores comunes al copiar la clave privada del JSON de la cuenta
 * de servicio a una variable de entorno: comillas envolventes pegadas por
 * accidente (rompen el parseo PEM) y "\n" literales en vez de saltos de
 * línea reales (el formato en que Firebase entrega el JSON).
 */
function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function getFirebaseApp() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return null;
  }
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

export async function sendPushNotification(
  deviceToken: string | null | undefined,
  title: string,
  body: string,
): Promise<boolean> {
  if (!deviceToken) return false;
  const app = getFirebaseApp();
  if (!app) {
    console.info(`[push:no-op] Firebase no configurado — se omite push a ${deviceToken.slice(0, 8)}...: ${title}`);
    return false;
  }

  try {
    await getMessaging(app).send({ token: deviceToken, notification: { title, body } });
    return true;
  } catch (error) {
    console.error("[push] Error enviando notificación push:", error);
    return false;
  }
}
