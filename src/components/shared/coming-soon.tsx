/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Construction className="size-5" />
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
        <CardDescription>{phase} — en construcción según el orden de la sección 10 de CLAUDE.md.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
