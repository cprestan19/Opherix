/* Service worker de Firebase Cloud Messaging — maneja push en segundo plano.
   Requiere NEXT_PUBLIC_FIREBASE_* configurados; si el proyecto no tiene
   Firebase real, este archivo simplemente nunca recibe mensajes. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Los valores reales se inyectan vía query string al registrar el SW
// (ver push-permission.tsx), ya que un service worker no tiene acceso a
// variables de entorno de Next.js.
const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? "Opherix", {
    body: body ?? "",
    icon: "/icons/icon-192.png",
  });
});
