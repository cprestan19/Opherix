/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { updatePayRulesAction } from "./actions";

interface PayRulesFormProps {
  overtimeMultiplier: string;
  sundayMultiplier: string;
  holidayMultiplier: string;
}

export function PayRulesForm({ overtimeMultiplier, sundayMultiplier, holidayMultiplier }: PayRulesFormProps) {
  const [values, setValues] = useState({ overtimeMultiplier, sundayMultiplier, holidayMultiplier });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    setSaved(false);
    await updatePayRulesAction({
      overtimeMultiplier: Number(values.overtimeMultiplier),
      sundayMultiplier: Number(values.sundayMultiplier),
      holidayMultiplier: Number(values.holidayMultiplier),
    });
    setIsSubmitting(false);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>Multiplicador hora extra</FieldLabel>
          <Input
            type="number"
            step="0.1"
            value={values.overtimeMultiplier}
            onChange={(e) => setValues((v) => ({ ...v, overtimeMultiplier: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel>Multiplicador domingo</FieldLabel>
          <Input
            type="number"
            step="0.1"
            value={values.sundayMultiplier}
            onChange={(e) => setValues((v) => ({ ...v, sundayMultiplier: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel>Multiplicador feriado</FieldLabel>
          <Input
            type="number"
            step="0.1"
            value={values.holidayMultiplier}
            onChange={(e) => setValues((v) => ({ ...v, holidayMultiplier: e.target.value }))}
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSubmitting} className="w-fit gap-2">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Guardar reglas de pago
        </Button>
        {saved ? <span className="text-sm text-success">Guardado</span> : null}
      </div>
    </div>
  );
}
