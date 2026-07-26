/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
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
import { toast } from "sonner";
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
import { Field, FieldDescription, FieldError, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { createCompanySchema, type CreateCompanyInput } from "@/lib/validations/platform";
import { slugify } from "@/lib/slugify";
import { createCompanyAction } from "./actions";

const defaultValues: CreateCompanyInput = {
  name: "",
  slug: "",
  country: "",
  adminName: "",
  adminEmail: "",
  password: "",
};

export function CompanyForm() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyInput>({ resolver: zodResolver(createCompanySchema), defaultValues });

  const nameValue = watch("name");

  async function onSubmit(values: CreateCompanyInput) {
    setServerError(null);
    const result = await createCompanyAction(values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Empresa creada correctamente");
    reset(defaultValues);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="size-4" /> Nueva empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nueva empresa cliente de Opherix</DialogTitle>
            <DialogDescription>
              Crea el tenant y su primera cuenta de Administrador para que puedan empezar a operar.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nombre de la empresa</FieldLabel>
            <Input
              id="name"
              {...register("name", {
                onChange: (e) => setValue("slug", slugify(e.target.value)),
              })}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.slug}>
              <FieldLabel htmlFor="slug">Identificador (slug)</FieldLabel>
              <Input id="slug" {...register("slug")} />
              <FieldDescription>Usado en su enlace de postulación: /postulate/{watch("slug") || "slug"}</FieldDescription>
              <FieldError errors={[errors.slug]} />
            </Field>
            <Field data-invalid={!!errors.country}>
              <FieldLabel htmlFor="country">País (ISO-2)</FieldLabel>
              <Input id="country" placeholder="PA, CO, DO, GT..." maxLength={2} {...register("country")} />
              <FieldError errors={[errors.country]} />
            </Field>
          </div>

          <FieldSeparator>Primer administrador</FieldSeparator>

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.adminName}>
              <FieldLabel htmlFor="adminName">Nombre</FieldLabel>
              <Input id="adminName" {...register("adminName")} />
              <FieldError errors={[errors.adminName]} />
            </Field>
            <Field data-invalid={!!errors.adminEmail}>
              <FieldLabel htmlFor="adminEmail">Correo de acceso</FieldLabel>
              <Input id="adminEmail" type="email" {...register("adminEmail")} />
              <FieldError errors={[errors.adminEmail]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Contraseña inicial</FieldLabel>
            <PasswordInput id="password" {...register("password")} />
            <FieldError errors={[errors.password]} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !nameValue}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
