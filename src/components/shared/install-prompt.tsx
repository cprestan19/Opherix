/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "opherix-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

/**
 * Nudge de instalación PWA (§9.3) — Android/Chrome captura
 * `beforeinstallprompt` y muestra un botón directo; iOS Safari no dispara
 * ese evento (nunca lo soportó), así que ahí se muestran las instrucciones
 * manuales de "Compartir > Agregar a pantalla de inicio". Se descarta
 * silenciosamente si ya está instalado o si el usuario ya lo cerró antes.
 */
export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;
    setDismissed(false);

    if (isIOS()) {
      setShowIOSHint(true);
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setDismissed(true);
    setInstallEvent(null);
  }

  if (dismissed || (!installEvent && !showIOSHint)) return null;

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-violet-3 p-3 text-sm md:mx-6">
      {showIOSHint ? (
        <>
          <Share className="size-4 shrink-0 text-primary" />
          <p className="flex-1 text-foreground">
            Instala Opherix: toca <strong>Compartir</strong> y luego <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.
          </p>
        </>
      ) : (
        <>
          <Download className="size-4 shrink-0 text-primary" />
          <p className="flex-1 text-foreground">Instala Opherix como app para acceso rápido.</p>
          <Button size="sm" className="shrink-0" onClick={handleInstall}>
            Instalar
          </Button>
        </>
      )}
      <Button size="icon" variant="ghost" className="shrink-0" aria-label="Cerrar" onClick={handleDismiss}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
