/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { updateEmailConfigAction, sendTestEmailAction } from "./actions";

interface EmailConfigFormProps {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  hasPassword: boolean;
}

export function EmailConfigForm({
  smtpHost,
  smtpPort,
  smtpUser,
  smtpFromEmail,
  smtpFromName,
  hasPassword,
}: EmailConfigFormProps) {
  const [values, setValues] = useState({
    smtpHost,
    smtpPort: String(smtpPort),
    smtpUser,
    smtpPassword: "",
    smtpFromEmail,
    smtpFromName,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateEmailConfigAction({
      smtpHost: values.smtpHost,
      smtpPort: Number(values.smtpPort),
      smtpUser: values.smtpUser,
      smtpPassword: values.smtpPassword || undefined,
      smtpFromEmail: values.smtpFromEmail,
      smtpFromName: values.smtpFromName || undefined,
    });
    setIsSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setValues((v) => ({ ...v, smtpPassword: "" }));
    toast.success("Configuración de correo guardada correctamente");
  }

  async function handleTest() {
    setIsTesting(true);
    const result = await sendTestEmailAction();
    setIsTesting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Correo de prueba enviado — revisa tu bandeja de entrada");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="smtpHost">Servidor SMTP</FieldLabel>
          <Input
            id="smtpHost"
            placeholder="smtp.gmail.com"
            value={values.smtpHost}
            onChange={(e) => setValues((v) => ({ ...v, smtpHost: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="smtpPort">Puerto</FieldLabel>
          <Input
            id="smtpPort"
            type="number"
            value={values.smtpPort}
            onChange={(e) => setValues((v) => ({ ...v, smtpPort: e.target.value }))}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="smtpUser">Usuario (correo Gmail)</FieldLabel>
          <Input
            id="smtpUser"
            type="email"
            placeholder="tuempresa@gmail.com"
            value={values.smtpUser}
            onChange={(e) => setValues((v) => ({ ...v, smtpUser: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="smtpPassword">Contraseña de aplicación</FieldLabel>
          <Input
            id="smtpPassword"
            type="password"
            placeholder={hasPassword ? "•••••••••••••• (configurada — deja en blanco para no cambiar)" : "Contraseña de aplicación de Google"}
            value={values.smtpPassword}
            onChange={(e) => setValues((v) => ({ ...v, smtpPassword: e.target.value }))}
          />
          <FieldDescription>
            En Gmail, genera una en Cuenta de Google &gt; Seguridad &gt; Contraseñas de aplicaciones (requiere
            verificación en 2 pasos activada).
          </FieldDescription>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="smtpFromEmail">Correo remitente</FieldLabel>
          <Input
            id="smtpFromEmail"
            type="email"
            value={values.smtpFromEmail}
            onChange={(e) => setValues((v) => ({ ...v, smtpFromEmail: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="smtpFromName">Nombre remitente</FieldLabel>
          <Input
            id="smtpFromName"
            placeholder="Tu empresa"
            value={values.smtpFromName}
            onChange={(e) => setValues((v) => ({ ...v, smtpFromName: e.target.value }))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="w-fit gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Guardar configuración de correo
        </Button>
        {hasPassword ? (
          <Button
            type="button"
            variant="outline"
            disabled={isTesting}
            onClick={handleTest}
            className="w-fit gap-2"
          >
            {isTesting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Enviar correo de prueba
          </Button>
        ) : null}
      </div>
    </div>
  );
}
