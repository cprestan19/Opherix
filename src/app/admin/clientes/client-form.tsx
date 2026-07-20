/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { createClientSchema, type CreateClientInput } from "@/lib/validations/client";
import { createClientAction } from "./actions";

const defaultValues: CreateClientInput = {
  businessName: "",
  taxId: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  password: "",
};

export function ClientForm() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({ resolver: zodResolver(createClientSchema), defaultValues });

  async function onSubmit(values: CreateClientInput) {
    setServerError(null);
    const result = await createClientAction(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    reset(defaultValues);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="size-4" /> Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nueva cuenta cliente</DialogTitle>
            <DialogDescription>
              Se creará la empresa cliente y un usuario de acceso con el correo indicado.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.businessName}>
            <FieldLabel htmlFor="businessName">Nombre de la empresa</FieldLabel>
            <Input id="businessName" {...register("businessName")} />
            <FieldError errors={[errors.businessName]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.contactName}>
              <FieldLabel htmlFor="contactName">Nombre de contacto</FieldLabel>
              <Input id="contactName" {...register("contactName")} />
              <FieldError errors={[errors.contactName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="contactPhone">Teléfono</FieldLabel>
              <Input id="contactPhone" {...register("contactPhone")} />
            </Field>
          </div>
          <Field data-invalid={!!errors.contactEmail}>
            <FieldLabel htmlFor="contactEmail">Correo de acceso</FieldLabel>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            <FieldError errors={[errors.contactEmail]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Contraseña inicial</FieldLabel>
            <PasswordInput id="password" {...register("password")} />
            <FieldError errors={[errors.password]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Dirección</FieldLabel>
            <Input id="address" {...register("address")} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
