/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getCurrentUser } from "@/lib/tenant";
import { listPlatformAdmins } from "@/services/platform.service";
import { AdminForm } from "./admin-form";
import { AdminList } from "./admin-list";

export default async function EquipoPage() {
  const user = await getCurrentUser();
  const admins = await listPlatformAdmins();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground">
            {admins.length} persona(s) con acceso de dueño de la plataforma Opherix.
          </p>
        </div>
        <AdminForm />
      </div>
      <AdminList admins={admins} currentAdminId={user.id} />
    </div>
  );
}
