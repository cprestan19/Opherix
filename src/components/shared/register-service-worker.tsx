/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect } from "react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function buildServiceWorkerUrl() {
  const { apiKey, messagingSenderId, appId } = firebaseConfig;
  if (!apiKey || !messagingSenderId || !appId) return "/firebase-messaging-sw.js";
  const params = new URLSearchParams({ apiKey, messagingSenderId, appId });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

/**
 * Único punto de registro del service worker de FCM — se monta en TODAS las
 * páginas (layout raíz), incluidas las públicas de /solicitar donde el
 * cliente nunca inicia sesión, e incluye las credenciales de Firebase desde
 * ya si están configuradas (no hace falta esperar el permiso de
 * notificación para eso, `PushPermission` lo pide aparte antes de sacar el
 * token). Antes había un segundo `register()` con las mismas credenciales
 * dentro de `PushPermission` (portales autenticados) — como Next sirve el
 * mismo archivo estático sin importar el query string, el navegador ve
 * bytes idénticos en ambas llamadas y no reinstala el service worker en la
 * segunda; el que ganara la carrera se quedaba activo. Si ganaba este
 * componente en su versión anterior (sin credenciales, siempre corría de
 * inmediato) el push en segundo plano quedaba roto en silencio en los
 * portales. Ahora solo hay un registro, siempre con credenciales cuando
 * existen — no hay carrera que ganar.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(buildServiceWorkerUrl()).catch(() => {
      // silencioso: nunca debe romper la navegación
    });
  }, []);

  return null;
}
