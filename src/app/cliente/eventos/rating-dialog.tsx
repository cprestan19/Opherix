/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { cn } from "@/lib/utils";
import { submitRatingAction } from "./rating-actions";

export function RatingDialog({ assignmentId, workerName }: { assignmentId: string; workerName: string }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (score === 0) {
      setError("Selecciona una calificación.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await submitRatingAction(assignmentId, score, comment);
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Star className="size-3.5" /> Calificar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calificar a {workerName}</DialogTitle>
          <DialogDescription>Tu calificación ayuda a mejorar la calidad del servicio.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setScore(value)}>
              <Star
                className={cn(
                  "size-8 transition-colors",
                  value <= score ? "fill-warning text-warning" : "text-border",
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentario (opcional)"
          rows={3}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Enviar calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
