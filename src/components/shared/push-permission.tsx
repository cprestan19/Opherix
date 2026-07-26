/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect } from "react";
import { registerForPushNotifications } from "@/lib/firebase-client";

/**
 * Se monta una vez por sesión de portal; intenta registrar el dispositivo
 * para push silenciosamente. No renderiza nada — si Firebase no está
 * configurado o el usuario no da permiso, simplemente no pasa nada (§9.3).
 */
export function PushPermission() {
  useEffect(() => {
    registerForPushNotifications()
      .then((token) => {
        if (!token) return;
        return fetch("/api/notifications/register-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      })
      .catch(() => {
        // silencioso: push es un refuerzo, nunca debe romper la navegación
      });
  }, []);

  return null;
}
