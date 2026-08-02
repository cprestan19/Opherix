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
import { createClientSchema, type CreateClientInput } from "@/lib/validations/client";
import { updateClientAction } from "../actions";

export function EditClientForm({ clientId, client }: { clientId: string; client: CreateClientInput }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({ resolver: zodResolver(createClientSchema), defaultValues: client });

  async function onSubmit(values: CreateClientInput) {
    setServerError(null);
    const result = await updateClientAction(clientId, values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Cliente actualizado correctamente");
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) reset(client);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Pencil className="size-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Actualiza los datos de contacto y facturación — el enlace propio del cliente no cambia.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.businessName}>
            <FieldLabel htmlFor="edit-client-businessName">Nombre de la empresa</FieldLabel>
            <Input id="edit-client-businessName" {...register("businessName")} />
            <FieldError errors={[errors.businessName]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.contactName}>
              <FieldLabel htmlFor="edit-client-contactName">Nombre de contacto</FieldLabel>
              <Input id="edit-client-contactName" {...register("contactName")} />
              <FieldError errors={[errors.contactName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-client-contactPhone">Teléfono</FieldLabel>
              <Input id="edit-client-contactPhone" {...register("contactPhone")} />
            </Field>
          </div>
          <Field data-invalid={!!errors.contactEmail}>
            <FieldLabel htmlFor="edit-client-contactEmail">Correo de contacto</FieldLabel>
            <Input id="edit-client-contactEmail" type="email" {...register("contactEmail")} />
            <FieldError errors={[errors.contactEmail]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-client-taxId">RUC</FieldLabel>
            <Input id="edit-client-taxId" {...register("taxId")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-client-address">Dirección</FieldLabel>
            <Input id="edit-client-address" {...register("address")} />
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
