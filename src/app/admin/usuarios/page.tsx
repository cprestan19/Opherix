/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/tenant";
import { listCompanyUsers } from "@/services/company-user.service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { companyUserRoleLabels } from "@/lib/validations/company-user";
import { CreateUserForm } from "./create-user-form";
import { EditUserForm } from "./edit-user-form";
import { SetPasswordForm } from "./set-password-form";
import { UserRowActions } from "./user-row-actions";

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

export default async function UsuariosPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "ADMIN") redirect("/admin");
  if (!currentUser.companyId) redirect("/admin");

  const users = await listCompanyUsers(currentUser.companyId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} cuenta(s) del portal Administrador — Administrador, Supervisor y Usuario (solo lectura).
          </p>
        </div>
        <CreateUserForm />
      </div>

      {users.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay usuarios registrados.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.id}>
                <div className="flex flex-col gap-3 py-3 pr-4 pl-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={u.image ?? undefined} alt={u.name} />
                      <AvatarFallback className="text-xs">{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{u.name}</p>
                        <Badge variant="secondary" className="shrink-0">
                          {companyUserRoleLabels[u.role as keyof typeof companyUserRoleLabels]}
                        </Badge>
                        <Badge variant={u.status === "ACTIVE" ? "secondary" : "outline"} className="shrink-0">
                          {u.status === "ACTIVE" ? "Activo" : "Suspendido"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Creado: {dateFormatter.format(u.createdAt)} · Último ingreso:{" "}
                        {u.lastLoginAt ? dateFormatter.format(u.lastLoginAt) : "Nunca"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <EditUserForm userId={u.id} name={u.name} email={u.email} phone={u.phone} image={u.image} />
                    <SetPasswordForm userId={u.id} userName={u.name} />
                    <UserRowActions
                      userId={u.id}
                      role={u.role}
                      status={u.status}
                      isSelf={u.id === currentUser.id}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
