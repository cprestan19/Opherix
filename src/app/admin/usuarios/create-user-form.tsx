/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createCompanyUserSchema,
  companyUserRoleValues,
  companyUserRoleLabels,
  companyUserRoleDescriptions,
  type CreateCompanyUserInput,
} from "@/lib/validations/company-user";
import { createCompanyUserAction } from "./actions";

const defaultValues: CreateCompanyUserInput = { name: "", email: "", phone: "", role: "SUPERVISOR" };

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyUserInput>({ resolver: zodResolver(createCompanyUserSchema), defaultValues });

  const selectedRole = watch("role");

  async function onSubmit(values: CreateCompanyUserInput) {
    setServerError(null);
    const result = await createCompanyUserAction(values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Usuario creado — se le envió un correo para elegir su contraseña.");
    reset(defaultValues);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <UserPlus className="size-4" /> Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Se le enviará un correo para que elija su propia contraseña — nunca se genera ni se muestra una aquí.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
            <Input id="name" {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Correo</FieldLabel>
            <Input id="email" type="email" {...register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field data-invalid={!!errors.role}>
            <FieldLabel htmlFor="role">Rol</FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyUserRoleValues.map((role) => (
                      <SelectItem key={role} value={role}>
                        {companyUserRoleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">{companyUserRoleDescriptions[selectedRole]}</p>
            <FieldError errors={[errors.role]} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
