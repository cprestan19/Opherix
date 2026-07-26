/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { OpherixLogo } from "@/components/shared/opherix-logo";

interface PublicFormHeaderProps {
  title: string;
  description: string;
}

/**
 * Encabezado de marca para las páginas públicas sin sesión (postulación,
 * solicitud de evento) — se monta encima del Card con márgenes negativos
 * (-(--card-spacing), la misma variable que usa Card para su padding) para
 * cubrir de borde a borde en vez de dejar el margen blanco del Card por
 * fuera.
 */
export function PublicFormHeader({ title, description }: PublicFormHeaderProps) {
  return (
    <div className="-mx-(--card-spacing) -mt-(--card-spacing) rounded-t-xl bg-primary px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="mb-4 flex items-center justify-center gap-2">
        <OpherixLogo size={28} />
        <span className="text-lg font-bold text-white">Opherix</span>
      </div>
      <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/80">{description}</p>
    </div>
  );
}
