/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SharePostulationLink({ url, companyName }: { url: string; companyName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const message = `¡Hola! Te comparto el enlace para postularte a trabajar con ${companyName}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Enlace de postulación</CardTitle>
        <CardDescription>Compártelo con candidatos para que llenen su perfil y apliquen.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Input readOnly value={url} className="font-mono text-xs sm:text-sm" onFocus={(e) => e.target.select()} />
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copiar
          </Button>
          <Button type="button" size="sm" className="gap-1.5" onClick={handleWhatsApp}>
            <MessageCircle className="size-4" /> WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
