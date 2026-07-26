/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpherixLogo } from "@/components/shared/opherix-logo";

export const metadata: Metadata = {
  title: "Postúlate | Opherix",
};

export default function PostulatePage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <OpherixLogo size={32} />
            <span className="text-xl font-bold">Opherix</span>
          </div>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Formulario de postulación</CardTitle>
            <CardDescription>
              Regístrate como personal de eventos: meseros, bartenders, anfitriones, cocineros,
              seguridad y más.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
              <LinkIcon className="size-6 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Necesitas el enlace de postulación específico de la empresa a la que quieres unirte
                (algo como <span className="font-mono text-foreground">opherix.app/postulate/nombre-empresa</span>).
                Pídeselo directamente a esa empresa.
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline underline-offset-4">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
