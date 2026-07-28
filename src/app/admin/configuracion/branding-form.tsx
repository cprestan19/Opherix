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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { LogoUploadField } from "@/components/shared/logo-upload-field";
import { updateBrandingAction } from "./actions";

interface BrandingFormProps {
  name: string;
  taxId: string;
  phone: string;
  address: string;
  logoUrl: string;
}

export function BrandingForm({ name, taxId, phone, address, logoUrl }: BrandingFormProps) {
  const [values, setValues] = useState({ name, taxId, phone, address, logoUrl });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    await updateBrandingAction(values);
    setIsSubmitting(false);
    toast.success("Branding guardado correctamente");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Logo de la empresa</FieldLabel>
        <LogoUploadField
          folder="/company/branding"
          value={values.logoUrl || undefined}
          onChange={(url) => setValues((v) => ({ ...v, logoUrl: url }))}
        />
        <FieldDescription>Se muestra en los recibos PDF que se envían a tus clientes.</FieldDescription>
      </Field>
      <Field className="max-w-sm">
        <FieldLabel>Nombre de la empresa</FieldLabel>
        <Input value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>RUC</FieldLabel>
          <Input value={values.taxId} onChange={(e) => setValues((v) => ({ ...v, taxId: e.target.value }))} />
        </Field>
        <Field>
          <FieldLabel>Teléfono</FieldLabel>
          <Input value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
        </Field>
      </div>
      <Field>
        <FieldLabel>Dirección</FieldLabel>
        <Input value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} />
        <FieldDescription>Se usan como datos del emisor en las facturas PDF (Pagos &gt; Clientes).</FieldDescription>
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
