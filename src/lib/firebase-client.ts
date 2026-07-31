/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.messagingSenderId && firebaseConfig.appId);
}

/**
 * Pide permiso de notificación y obtiene el token de FCM del dispositivo.
 * Reutiliza el service worker que ya registró `RegisterServiceWorker` (con
 * las credenciales en el query string) en vez de volver a registrarlo aquí
 * — dos registros del mismo scope compitiendo hacía que el navegador se
 * quedara con el que llegara primero, ya que ve bytes idénticos entre
 * ambas llamadas y no reinstala. Devuelve null silenciosamente si Firebase
 * no está configurado o el navegador no soporta push (ej. iOS Safari fuera
 * de una PWA instalada, §9.3).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;

  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  }).catch(() => null);

  return token;
}
