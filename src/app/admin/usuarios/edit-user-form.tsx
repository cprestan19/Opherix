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
import { Loader2, Pencil } from "lucide-react";
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
import { PhotoCaptureField } from "@/components/shared/photo-capture-field";
import { editCompanyUserSchema, type EditCompanyUserInput } from "@/lib/validations/company-user";
import { editCompanyUserAction } from "./actions";

export function EditUserForm({
  userId,
  name,
  email,
  phone,
  image,
}: {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const defaultValues: EditCompanyUserInput = { name, email, phone: phone ?? "", image: image ?? "" };
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditCompanyUserInput>({ resolver: zodResolver(editCompanyUserSchema), defaultValues });

  async function onSubmit(values: EditCompanyUserInput) {
    setServerError(null);
    const result = await editCompanyUserAction(userId, values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Usuario actualizado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaultValues);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5">
          <Pencil className="size-3.5" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza el nombre, correo o teléfono de esta cuenta.</DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Foto de perfil</FieldLabel>
            <Controller
              control={control}
              name="image"
              render={({ field }) => (
                <PhotoCaptureField folder="/staff/photos" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="edit-name">Nombre completo</FieldLabel>
            <Input id="edit-name" {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="edit-email">Correo</FieldLabel>
            <Input id="edit-email" type="email" {...register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-phone">Teléfono</FieldLabel>
            <Input id="edit-phone" {...register("phone")} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
