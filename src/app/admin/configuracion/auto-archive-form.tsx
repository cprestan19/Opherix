/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { updateAutoArchiveDelayAction } from "./actions";
import type { AutoArchiveDelay } from "@/generated/prisma/enums";

const OPTIONS: { value: AutoArchiveDelay; label: string }[] = [
  { value: "OFF", label: "Desactivado — archivar solo manualmente" },
  { value: "IMMEDIATE", label: "Al finalizar el evento" },
  { value: "AFTER_1H", label: "1 hora después de finalizar" },
  { value: "AFTER_24H", label: "24 horas después de finalizar" },
];

export function AutoArchiveForm({ autoArchiveDelay }: { autoArchiveDelay: AutoArchiveDelay }) {
  const [value, setValue] = useState(autoArchiveDelay);
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next as AutoArchiveDelay);
    setIsSaving(true);
    try {
      await updateAutoArchiveDelayAction(next as AutoArchiveDelay);
      toast.success("Archivado automático actualizado");
    } catch {
      setValue(previous);
      toast.error("No se pudo guardar el cambio. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Field>
      <FieldLabel>Archivar eventos automáticamente</FieldLabel>
      <Select value={value} onValueChange={handleChange} disabled={isSaving}>
        <SelectTrigger className="w-full sm:w-80">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        Detecta la hora de finalización (fin) de cada evento y lo archiva automáticamente según lo que elijas
        aquí. Un evento archivado deja de aparecer en la lista activa de Eventos, pero conserva su historial.
      </FieldDescription>
    </Field>
  );
}
