/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OperixLogo } from "@/components/shared/operix-logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Operix",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-[var(--violet-12)] px-16 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(159,153,255,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(95,60,221,0.45), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <OperixLogo size={132} />
            <span className="text-[5.625rem] leading-none font-bold text-white">Operix</span>
          </div>
          <div>
            <p className="text-xl font-semibold text-primary">Workforce Management Platform</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              La plataforma inteligente para gestionar tu personal temporal de eventos de forma
              eficiente — reclutamiento, asignaciones, check-in y pagos, todo en un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-secondary p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="flex items-center gap-2">
              <OperixLogo size={32} />
              <span className="text-xl font-bold">Operix</span>
            </div>
          </div>
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Bienvenido de vuelta</CardTitle>
              <CardDescription>Ingresa con tu correo y contraseña</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Tu empresa todavía no usa Operix?{" "}
                <Link href="/signup" className="text-primary underline underline-offset-4">
                  Regístrala aquí
                </Link>
              </p>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                ¿Quieres unirte como personal de eventos?{" "}
                <Link href="/postulate" className="text-primary underline underline-offset-4">
                  Postúlate aquí
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
