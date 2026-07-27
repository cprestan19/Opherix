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
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PasswordInput } from "@/components/shared/password-input";
import {
  setCompanyUserPasswordSchema,
  type SetCompanyUserPasswordInput,
} from "@/lib/validations/company-user";
import { setCompanyUserPasswordAction } from "./actions";

const defaultValues: SetCompanyUserPasswordInput = { password: "", confirmPassword: "" };

export function SetPasswordForm({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetCompanyUserPasswordInput>({
    resolver: zodResolver(setCompanyUserPasswordSchema),
    defaultValues,
  });

  async function onSubmit(values: SetCompanyUserPasswordInput) {
    setServerError(null);
    const result = await setCompanyUserPasswordAction(userId, values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Contraseña actualizada");
    reset(defaultValues);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset(defaultValues);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5">
          <KeyRound className="size-3.5" /> Contraseña
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Establecer contraseña</DialogTitle>
            <DialogDescription>
              Define directamente la contraseña de <strong>{userName}</strong>. Se le avisará por correo que
              cambió.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
            <PasswordInput id="new-password" autoComplete="new-password" {...register("password")} />
            <FieldError errors={[errors.password]} />
          </Field>
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
            <PasswordInput id="confirm-password" autoComplete="new-password" {...register("confirmPassword")} />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
