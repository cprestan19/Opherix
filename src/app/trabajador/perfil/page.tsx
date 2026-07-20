/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerProfileByUserId } from "@/services/worker-profile.service";
import { WorkerCv } from "@/components/shared/worker-cv";

export default async function PerfilTrabajadorPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerProfileByUserId(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Tu perfil profesional generado automáticamente.</p>
      </div>
      <WorkerCv
        worker={{
          id: worker.id,
          name: worker.user.name,
          email: worker.user.email,
          phone: worker.user.phone,
          photoUrl: worker.photoUrl,
          specialties: worker.specialties,
          experienceYears: worker.experienceYears,
          education: worker.education,
          address: worker.address,
          languages: worker.languages,
          courses: worker.courses,
          previousEmployers: worker.previousEmployers,
          licenses: worker.licenses,
          ratingAverage: worker.ratingAverage.toString(),
          ratingCount: worker.ratingCount,
        }}
      />
    </div>
  );
}
