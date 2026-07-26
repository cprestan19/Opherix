/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { NextConfig } from "next";

// CSP deliberadamente permisiva en script-src/style-src ('unsafe-inline'):
// Next.js App Router inyecta <script> inline con el payload RSC/hydration en
// cada página, y varios componentes (BackgroundBeams, shadcn/ui) fijan estilos
// vía el atributo `style` — ambos requieren 'unsafe-inline' salvo que se migre
// a nonces por request (cambio mayor, no justificado solo por este hardening).
// El resto de directivas sí queda restringido a los orígenes que la app
// realmente usa (ImageKit, Google Maps, Firebase, Cloudflare Turnstile).
// 'unsafe-eval' solo en desarrollo: React lo usa para reconstruir stack
// traces en modo dev (nunca en producción, ver warning de Next/React) — sin
// esto la consola se llena de errores de eval() bloqueado en `next dev`.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://ik.imagekit.io https://maps.gstatic.com https://maps.googleapis.com",
  "font-src 'self' data:",
  // https://*.imagekit.io (no solo ik.imagekit.io): la subida real del
  // cliente (@imagekit/react `upload()`) postea a upload.imagekit.io, un
  // subdominio distinto al de lectura/CDN — restringir solo a ik.imagekit.io
  // bloqueaba la subida de fotos con un error de CSP silencioso.
  "connect-src 'self' https://*.imagekit.io https://maps.googleapis.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
