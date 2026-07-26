/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";

/**
 * Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY configurada, no renderiza nada — el
 * formulario público sigue funcionando sin captcha (ver src/lib/turnstile.ts,
 * mismo patrón que Google login en auth.ts).
 */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));

  useEffect(() => {
    if (!SITE_KEY || scriptLoaded) return;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, [scriptLoaded]);

  useEffect(() => {
    if (!SITE_KEY || !scriptLoaded || !containerRef.current || !window.turnstile) return;
    const widgetId = window.turnstile.render(containerRef.current, { sitekey: SITE_KEY, callback: onVerify });
    return () => window.turnstile?.remove(widgetId);
  }, [scriptLoaded, onVerify]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}
