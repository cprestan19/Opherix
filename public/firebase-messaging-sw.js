/* Service worker de Firebase Cloud Messaging — maneja push en segundo plano.
   También se registra sin parámetros en TODAS las páginas (incluidas las
   públicas de /solicitar) solo para que el navegador cuente con un service
   worker activo (mejora la calidad del WebAPK que genera Chrome/Android al
   instalar la PWA) — en ese caso, sin credenciales, no hace nada de FCM. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Los valores reales se inyectan vía query string al registrar el SW
// (ver push-permission.tsx), ya que un service worker no tiene acceso a
// variables de entorno de Next.js.
const params = new URLSearchParams(self.location.search);
const apiKey = params.get("apiKey");
const messagingSenderId = params.get("messagingSenderId");
const appId = params.get("appId");

if (apiKey && messagingSenderId && appId) {
  firebase.initializeApp({ apiKey, messagingSenderId, appId });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {};
    self.registration.showNotification(title ?? "Opherix", {
      body: body ?? "",
      icon: "/icons/icon-192.png",
    });
  });
}
