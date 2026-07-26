/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface BackgroundBeamsProps {
  className?: string;
  /** Cantidad de haces — por defecto 11 (dentro del rango 10–15 pedido, del lado minimal). */
  count?: number;
}

const COLORS = ["#26D9FF", "#4B7BFF", "#8B5CF6"];

interface Beam {
  id: number;
  originXPct: number;
  originYPct: number;
  length: number;
  angle: number;
  color: string;
  lineOpacity: number;
  glowOpacity: number;
  duration: number;
  delay: number;
  sparkle: boolean;
  pulseSize: number;
  pulsePeakOpacity: number;
}

// PRNG determinista (mulberry32) sembrado por índice — server y cliente deben
// renderizar los mismos valores "aleatorios" en el primer render; Math.random()
// aquí produciría un mismatch de hidratación entre SSR y cliente.
function mulberry32(seed: number) {
  let s = seed | 0;
  return function random() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateBeams(count: number): Beam[] {
  const beams: Beam[] = [];
  for (let i = 0; i < count; i++) {
    const rand = mulberry32(i * 7919 + 101);
    // 0 = pegado a la esquina, 1 = el más lejano del grupo — abre el abanico
    // sin perder el origen común en el borde derecho/inferior.
    const spread = i / Math.max(count - 1, 1);

    beams.push({
      id: i,
      // Expresado como `left`/`top` (no `right`/`bottom`): con
      // `transformOrigin: "left center"`, el pivote de la rotación es la
      // esquina IZQUIERDA de la barra, así que el ancla real tiene que
      // definirse con `left`/`top` para caer donde de verdad queremos que
      // nazca el haz. >100% a propósito: nace fuera del borde visible (el
      // propio `overflow-hidden` lo recorta), para que llegue realmente
      // "hasta la derecha" en vez de quedar corto hacia adentro.
      originXPct: 100 - spread * 6 + rand() * 8,
      originYPct: 100 - spread * 5 + rand() * 8,
      length: 780 + rand() * 520,
      angle: 205 + rand() * 20, // ~205–225°: diagonal hacia arriba-izquierda, más consistente entre sí
      color: COLORS[Math.floor(rand() * COLORS.length)],
      lineOpacity: 0.22 + rand() * 0.28,
      glowOpacity: 0.06 + rand() * 0.08,
      duration: 4.5 + rand() * 3.5,
      delay: rand() * 6,
      sparkle: rand() > 0.6,
      pulseSize: 3.5 + rand() * 2.5,
      pulsePeakOpacity: 0.6 + rand() * 0.4,
    });
  }
  return beams;
}

/**
 * Fondo decorativo tipo "fibra óptica": haces diagonales estáticos anclados
 * al borde inferior derecho, cada uno con un núcleo delgado + halo de
 * resplandor detrás, y un pulso de luz (con cola tipo cometa) que viaja por
 * encima de forma continua. Solo anima `transform`/`opacity` (GPU-friendly) —
 * nada de canvas, WebGL ni filtros SVG. Puramente decorativo:
 * `pointer-events-none` y posicionado en absoluto detrás del contenido real.
 */
export function BackgroundBeams({ className, count = 11 }: BackgroundBeamsProps) {
  const beams = useMemo(() => generateBeams(count), [count]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
      style={{
        // Concentra todo el efecto cerca de la esquina — se disuelve hacia
        // el centro en vez de que las líneas simplemente "corten" al llegar
        // a su largo máximo.
        maskImage: "radial-gradient(130% 130% at 100% 100%, black 38%, transparent 82%)",
        WebkitMaskImage: "radial-gradient(130% 130% at 100% 100%, black 38%, transparent 82%)",
      }}
    >
      {/* resplandor radial suave detrás del origen de los haces */}
      <div
        className="absolute -right-[15%] -bottom-[15%] h-[70%] w-[70%]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)",
          filter: "blur(56px)",
        }}
      />

      {beams.map((beam) => (
        <div
          key={beam.id}
          className="absolute"
          style={{
            left: `${beam.originXPct}%`,
            top: `${beam.originYPct}%`,
            width: beam.length,
            height: 1,
            transform: `rotate(${beam.angle}deg)`,
            transformOrigin: "left center",
          }}
        >
          {/* halo de resplandor — capa ancha y difusa detrás del núcleo */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
            style={{
              width: beam.length,
              height: 14,
              background: `linear-gradient(90deg, ${beam.color} 0%, ${beam.color} 25%, transparent 75%)`,
              opacity: beam.glowOpacity,
              filter: "blur(6px)",
            }}
          />

          {/* núcleo — línea delgada y nítida */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
            style={{
              width: beam.length,
              height: 1,
              background: `linear-gradient(90deg, ${beam.color} 0%, ${beam.color} 22%, transparent 78%)`,
              opacity: beam.lineOpacity,
            }}
          />

          {/* cola tipo cometa detrás del pulso — 2 rastros con más blur/menos opacidad */}
          {[0.16, 0.09].map((trailOffset, idx) => (
            <motion.div
              key={idx}
              className="absolute top-1/2 rounded-full"
              style={{
                width: beam.pulseSize * (1 - idx * 0.25),
                height: beam.pulseSize * (1 - idx * 0.25),
                marginTop: -(beam.pulseSize * (1 - idx * 0.25)) / 2,
                background: beam.color,
                filter: `blur(${1.5 + idx}px)`,
              }}
              initial={false}
              animate={{
                x: [-beam.length * trailOffset, beam.length - beam.length * trailOffset],
                opacity: [0, beam.pulsePeakOpacity * (0.5 - idx * 0.15), beam.pulsePeakOpacity * (0.5 - idx * 0.15), 0],
              }}
              transition={{
                duration: beam.duration,
                delay: beam.delay,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.18, 0.85, 1],
              }}
            />
          ))}

          {/* pulso de luz principal — solo transform (x) y opacity */}
          <motion.div
            className="absolute top-1/2 rounded-full"
            style={{
              width: beam.pulseSize,
              height: beam.pulseSize,
              marginTop: -beam.pulseSize / 2,
              background: beam.color,
              boxShadow: `0 0 6px 2px ${beam.color}, 0 0 16px 5px ${beam.color}77`,
              filter: "blur(0.5px)",
            }}
            initial={false}
            animate={{
              x: [0, beam.length],
              opacity: [0, beam.pulsePeakOpacity, beam.pulsePeakOpacity, 0],
            }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.15, 0.85, 1],
            }}
          />

          {/* destello ocasional a mitad de camino, solo en algunos haces */}
          {beam.sparkle ? (
            <motion.div
              className="absolute top-1/2 rounded-full"
              style={{
                left: beam.length * 0.5,
                width: beam.pulseSize * 2.5,
                height: beam.pulseSize * 2.5,
                marginTop: -(beam.pulseSize * 2.5) / 2,
                background: beam.color,
                filter: "blur(3px)",
              }}
              initial={false}
              animate={{
                opacity: [0, 0, 0.75, 0],
                scale: [0.4, 0.4, 1.3, 0.4],
              }}
              transition={{
                duration: beam.duration,
                delay: beam.delay,
                repeat: Infinity,
                ease: "easeOut",
                times: [0, 0.42, 0.5, 0.6],
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
