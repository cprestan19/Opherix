/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Field, FieldError, FieldLabel, FieldDescription } from "@/components/ui/field";
import { createWorkerSchema, type CreateWorkerInput } from "@/lib/validations/worker-create";
import { specialtyValues, specialtyLabels } from "@/lib/validations/worker-application";
import { cn } from "@/lib/utils";
import { createWorkerAction } from "./actions";

const defaultValues: CreateWorkerInput = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialties: [],
};

export function WorkerForm() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkerInput>({ resolver: zodResolver(createWorkerSchema), defaultValues });

  async function onSubmit(values: CreateWorkerInput) {
    setServerError(null);
    const result = await createWorkerAction(values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Trabajador creado correctamente");
    reset(defaultValues);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="size-4" /> Nuevo trabajador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nuevo trabajador</DialogTitle>
            <DialogDescription>
              Se crea la cuenta activa de inmediato. Podrás completar el resto de su perfil (documentos,
              disponibilidad, tarifa, etc.) después, desde su perfil.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="worker-name">Nombre completo</FieldLabel>
            <Input id="worker-name" {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="worker-email">Correo de acceso</FieldLabel>
              <Input id="worker-email" type="email" {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="worker-phone">Teléfono</FieldLabel>
              <Input id="worker-phone" {...register("phone")} />
              <FieldError errors={[errors.phone]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="worker-password">Contraseña inicial</FieldLabel>
            <PasswordInput id="worker-password" {...register("password")} />
            <FieldError errors={[errors.password]} />
          </Field>
          <Field data-invalid={!!errors.specialties}>
            <FieldLabel>Especialidades</FieldLabel>
            <Controller
              control={control}
              name="specialties"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {specialtyValues.map((value) => {
                    const checked = field.value.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            checked ? field.value.filter((v) => v !== value) : [...field.value, value],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {specialtyLabels[value]}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <FieldDescription>Puedes elegir más de una.</FieldDescription>
            <FieldError errors={[errors.specialties]} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear trabajador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
