/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companyUserRoleValues, companyUserRoleLabels } from "@/lib/validations/company-user";
import { setCompanyUserRoleAction, setCompanyUserStatusAction } from "./actions";
import type { UserRole, UserStatus } from "@/generated/prisma/enums";

export function UserRowActions({
  userId,
  role,
  status,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  status: UserStatus;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isRolePending, startRoleTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();

  if (isSelf) {
    return <p className="text-xs text-muted-foreground">Tu cuenta</p>;
  }

  function handleRoleChange(nextRole: string) {
    startRoleTransition(async () => {
      const result = await setCompanyUserRoleAction(userId, nextRole as UserRole);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Rol actualizado");
      router.refresh();
    });
  }

  function handleStatusToggle() {
    startStatusTransition(async () => {
      const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      const result = await setCompanyUserStatusAction(userId, nextStatus);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(nextStatus === "ACTIVE" ? "Usuario reactivado" : "Usuario suspendido");
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Select value={role} onValueChange={handleRoleChange} disabled={isRolePending}>
        <SelectTrigger size="sm" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {companyUserRoleValues.map((r) => (
            <SelectItem key={r} value={r}>
              {companyUserRoleLabels[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={isStatusPending}
        onClick={handleStatusToggle}
      >
        {isStatusPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : status === "ACTIVE" ? (
          <PowerOff className="size-3.5" />
        ) : (
          <Power className="size-3.5" />
        )}
        {status === "ACTIVE" ? "Suspender" : "Activar"}
      </Button>
    </div>
  );
}
