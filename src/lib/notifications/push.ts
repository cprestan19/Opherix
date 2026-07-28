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

export interface PushSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Nunca debe lanzar — un push es un refuerzo (§9.3), no puede romper la
 * acción de negocio que lo dispara (asignar, aprobar, etc.). Por eso TODO,
 * incluso construir las credenciales de Firebase Admin (cert/initializeApp
 * pueden lanzar si la clave está mal formada), va dentro del mismo try/catch
 * — antes `getFirebaseApp()` se llamaba fuera del try y una clave inválida
 * tumbaba la acción completa en vez de solo marcar el push como FAILED.
 */
export async function sendPushNotification(
  deviceToken: string | null | undefined,
  title: string,
  body: string,
): Promise<PushSendResult> {
  if (!deviceToken) return { ok: false, error: "El usuario no tiene un dispositivo registrado para push." };

  try {
    const app = getFirebaseApp();
    if (!app) {
      console.info(`[push:no-op] Firebase no configurado — se omite push a ${deviceToken.slice(0, 8)}...: ${title}`);
      return { ok: false, error: "Firebase no está configurado (faltan variables de entorno del servidor)." };
    }

    await getMessaging(app).send({ token: deviceToken, notification: { title, body } });
    return { ok: true };
  } catch (error) {
    console.error("[push] Error enviando notificación push:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al enviar el push.";
    return { ok: false, error: message };
  }
}
