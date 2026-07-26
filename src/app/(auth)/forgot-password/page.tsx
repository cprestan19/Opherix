/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpherixLogo } from "@/components/shared/opherix-logo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Opherix",
};

export default function ForgotPasswordPage() {
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
            <CardTitle className="text-xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              Ingresa tu correo y te enviamos un enlace para restablecerla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline underline-offset-4">
                Volver a iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
