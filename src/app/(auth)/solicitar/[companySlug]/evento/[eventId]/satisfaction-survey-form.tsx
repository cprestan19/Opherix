/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitEventRatingAction } from "./actions";

export function SatisfactionSurveyForm({
  companySlug,
  eventId,
  token,
  alreadyRated,
}: {
  companySlug: string;
  eventId: string;
  token: string;
  alreadyRated: boolean;
}) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyRated);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (score < 1) {
      setError("Selecciona una calificación.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await submitEventRatingAction(companySlug, eventId, token, score, comment);
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("¡Gracias por tu calificación!");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Encuesta de satisfacción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ya calificaste este servicio. ¡Gracias!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Encuesta de satisfacción</CardTitle>
        <CardDescription>¿Cómo calificarías el servicio del personal en este evento?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Calificar con ${value} de 5`}
              onClick={() => setScore(value)}
              className="rounded p-0.5"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  value <= score ? "fill-warning text-warning" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Cuéntanos cómo te fue con el personal asignado (opcional)"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-fit gap-2">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Enviar calificación
        </Button>
      </CardContent>
    </Card>
  );
}
