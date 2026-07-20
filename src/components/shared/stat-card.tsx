/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber, type NumberFormatKind } from "@/components/shared/motion/animated-number";

interface StatCardProps {
  label: string;
  value: number;
  format?: NumberFormatKind;
  suffix?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "danger" | "indigo";
  href?: string;
  linkLabel?: string;
}

const iconChipClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  indigo: "bg-indigo/10 text-indigo",
};

// Gradiente sutil por acento — patrón del bloque dashboard-01 de shadcn/ui
// (bg-gradient-to-t from-{color}/5 to-card shadow-xs), teñido para que
// combine con el color del ícono de cada tarjeta.
const cardGradientClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-gradient-to-t from-primary/8 to-card",
  success: "bg-gradient-to-t from-success/8 to-card",
  warning: "bg-gradient-to-t from-warning/8 to-card",
  danger: "bg-gradient-to-t from-danger/8 to-card",
  indigo: "bg-gradient-to-t from-indigo/8 to-card",
};

export function StatCard({
  label,
  value,
  format = "integer",
  suffix,
  icon: Icon,
  accent = "primary",
  href,
  linkLabel,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-xs transition-shadow hover:shadow-md", cardGradientClasses[accent])}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              iconChipClasses[accent],
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              <AnimatedNumber value={value} format={format} />
              {suffix ? <span className="ml-1 text-base font-medium text-muted-foreground">{suffix}</span> : null}
            </p>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        {href ? (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {linkLabel ?? `Ver ${label.toLowerCase()}`}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
