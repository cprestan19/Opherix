/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpherixLogo } from "@/components/shared/opherix-logo";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Cambiar contraseña | Opherix",
};

export default async function CambiarClavePage() {
  const user = await getCurrentUser();
  if (!user.mustChangePassword) redirect("/");

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            <OpherixLogo size={32} />
            <span className="text-xl font-bold">Opherix</span>
          </div>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Configura tu contraseña</CardTitle>
            <CardDescription>
              Un administrador te dio acceso al portal con una contraseña temporal. Elige una nueva contraseña
              privada antes de continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
