/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Image from "next/image";

interface OpherixLogoProps {
  size?: number;
  className?: string;
}

// Regla del proyecto (CLAUDE.md §3): ninguna imagen vive embebida en el
// código ni como archivo local en `public/` — todo asset visual se sube y
// se sirve desde ImageKit. Esta es la marca real (el "X" con gradiente
// cian → azul → púrpura, fondo recortado a transparente), subida como
// `/brand/opherix-mark.png` en el bucket de ImageKit del proyecto
// (actualizado 2026-07-25 con el logo oficial de Opherix).
// `?tr=f-png` fuerza el formato de salida: sin esto, la optimización
// automática de ImageKit sirve el archivo como JPEG (sin canal alfa) y el
// fondo transparente se aplana a blanco.
// `&v=` es un cache-buster manual: el CDN de ImageKit cachea por un año por
// URL exacta (`Cache-Control: max-age=31536000`) — al reemplazar el archivo
// en la misma ruta, el CDN seguía sirviendo la versión vieja. Incrementar
// este número fuerza una copia nueva cada vez que el archivo cambie.
const OPHERIX_MARK_URL = "https://ik.imagekit.io/eventstaff/brand/opherix-mark.png?tr=f-png&v=20260725b";

export function OpherixLogo({ size = 32, className }: OpherixLogoProps) {
  return (
    <Image
      src={OPHERIX_MARK_URL}
      alt="Opherix"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
      // El optimizador de imágenes de Next.js aplana el canal alfa de este
      // PNG a RGB (fondo blanco sólido) al reprocesarlo — ImageKit ya hace su
      // propia optimización vía `?tr=`, así que se sirve la URL tal cual.
      unoptimized
    />
  );
}
