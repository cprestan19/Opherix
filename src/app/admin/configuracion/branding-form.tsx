/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { updateBrandingAction } from "./actions";

export function BrandingForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    await updateBrandingAction(value);
    setIsSubmitting(false);
    toast.success("Branding guardado correctamente");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field className="max-w-sm">
        <FieldLabel>Nombre de la empresa</FieldLabel>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSubmitting} className="w-fit gap-2">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Guardar
        </Button>
      </div>
    </div>
  );
}
