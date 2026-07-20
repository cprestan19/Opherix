/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { removePlatformAdminAction } from "./actions";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function AdminList({
  admins,
  currentAdminId,
}: {
  admins: AdminRow[];
  currentAdminId: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {admins.map((admin) => (
        <AdminRowItem key={admin.id} admin={admin} isSelf={admin.id === currentAdminId} />
      ))}
    </div>
  );
}

function AdminRowItem({ admin, isSelf }: { admin: AdminRow; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    startTransition(async () => {
      const result = await removePlatformAdminAction(admin.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {admin.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {admin.name} {isSelf ? <span className="text-xs text-muted-foreground">(tú)</span> : null}
            </p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error ? <span className="text-xs text-danger">{error}</span> : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar a ${admin.name}`}
            disabled={isPending}
            onClick={handleRemove}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
