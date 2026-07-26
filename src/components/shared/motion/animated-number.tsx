/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export type NumberFormatKind = "integer" | "decimal1" | "currency" | "percentage";

function formatByKind(value: number, kind: NumberFormatKind): string {
  switch (kind) {
    case "currency":
      return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
    case "percentage":
      return `${Math.round(value)}%`;
    case "decimal1":
      return value.toFixed(1);
    case "integer":
    default:
      return Math.round(value).toString();
  }
}

interface AnimatedNumberProps {
  value: number;
  /**
   * Identificador de formato (no una función): una función no es serializable
   * al pasar de un Server Component a este Client Component (mismo problema
   * que las referencias a íconos — ver memoria del proyecto).
   */
  format?: NumberFormatKind;
  /** ms — tope 300 según la regla de animación del proyecto para transiciones puntuales; un contador es la excepción explícita (comunica carga de datos). */
  duration?: number;
}

/**
 * Contador que sube de 0 (o del valor anterior) al valor real al montar o al
 * cambiar `value`. Comunica un cambio de estado real (la cifra cargó/cambió),
 * no es decorativo. Respeta `prefers-reduced-motion` saltando directo al valor.
 */
export function AnimatedNumber({ value, format = "integer", duration = 0.6 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const hasMounted = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const from = hasMounted.current ? display : 0;
    hasMounted.current = true;

    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className="tabular-nums">{formatByKind(display, format)}</span>;
}
