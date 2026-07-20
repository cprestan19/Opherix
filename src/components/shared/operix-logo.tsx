/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Image from "next/image";

interface OperixLogoProps {
  size?: number;
  className?: string;
}

// Regla del proyecto (CLAUDE.md §3): ninguna imagen vive embebida en el
// código ni como archivo local en `public/` — todo asset visual se sube y
// se sirve desde ImageKit. Esta es la marca real (el "X" con gradiente
// cian → azul → púrpura, fondo recortado a transparente), subida a
// `/brand/operix-mark.png` en el bucket de ImageKit del proyecto.
const OPERIX_MARK_URL = "https://ik.imagekit.io/eventstaff/brand/operix-mark.png";

export function OperixLogo({ size = 32, className }: OperixLogoProps) {
  return (
    <Image
      src={OPERIX_MARK_URL}
      alt="Operix"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}
