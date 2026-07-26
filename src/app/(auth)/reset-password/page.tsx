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
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Opherix",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

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
            <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
            <CardDescription>Elige una nueva contraseña para tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="flex flex-col gap-4 text-center">
                <p className="text-sm text-danger">
                  Este enlace no incluye un token válido.
                </p>
                <Link href="/forgot-password" className="text-sm text-primary underline underline-offset-4">
                  Pedir un enlace nuevo
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
