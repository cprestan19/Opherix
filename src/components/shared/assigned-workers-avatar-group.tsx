/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

interface AssignedWorker {
  id: string;
  status: string;
  worker: { photoUrl: string | null; user: { name: string } };
}

export function AssignedWorkersAvatarGroup({
  assignments,
  max = 4,
}: {
  assignments: AssignedWorker[];
  max?: number;
}) {
  const active = assignments.filter((a) => a.status !== "CANCELLED" && a.status !== "REJECTED");
  if (active.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin personal asignado</p>;
  }

  const visible = active.slice(0, max);
  const overflow = active.length - visible.length;

  return (
    <AvatarGroup>
      {visible.map((a) => (
        <Avatar key={a.id} size="sm" title={a.worker.user.name}>
          <AvatarImage src={a.worker.photoUrl ?? undefined} alt={a.worker.user.name} />
          <AvatarFallback>{a.worker.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? <AvatarGroupCount className="size-6 text-xs">+{overflow}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}
