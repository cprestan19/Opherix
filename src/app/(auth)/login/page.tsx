/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpherixLogo } from "@/components/shared/opherix-logo";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { auth } from "@/lib/auth";
import { getPortalPath, sanitizeCallbackUrl } from "@/lib/portal-routing";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Opherix",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);

  // Si ya hay sesión (ej. el trabajador tocó el botón de WhatsApp con la app
  // todavía logueada en el navegador), no tiene sentido mostrarle el form de
  // nuevo — lo manda directo a donde iba.
  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl ?? getPortalPath(session.user.role, session.user.workerStatus, session.user.mustChangePassword));
  }

  return (
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-[var(--violet-12)] px-16 lg:flex">
        <BackgroundBeams />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center">
            <OpherixLogo size={250} />
            <span className="-ml-8 text-[5.625rem] leading-none font-bold text-white">Opherix</span>
          </div>
          <div className="pl-14">
            <p className="text-2xl font-semibold text-primary">Workforce Management Platform</p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">
              La plataforma inteligente para gestionar tu personal temporal de eventos de forma
              eficiente — reclutamiento, asignaciones, check-in y pagos, todo en un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-[var(--violet-12)] p-6 lg:w-1/2 lg:bg-secondary">
        <div className="lg:hidden">
          <BackgroundBeams />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="flex items-center">
              <OpherixLogo size={56} />
              <span className="-ml-2 text-3xl font-bold text-white">Opherix</span>
            </div>
          </div>
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Bienvenido de vuelta</CardTitle>
              <CardDescription>Ingresa con tu correo y contraseña</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm callbackUrl={callbackUrl} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
