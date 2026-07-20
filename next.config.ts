/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Toda imagen de la app (marca, fotos de trabajadores, documentos,
    // selfies de check-in) se sirve desde ImageKit — nunca embebida como
    // base64 en el código. Ver CLAUDE.md §3.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/eventstaff/**",
      },
    ],
  },
};

export default nextConfig;
