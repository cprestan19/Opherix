/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getWorkerDetail } from "@/repositories/worker.repository";
import { asStringArray, asEmployers, asUniformSizes } from "@/lib/worker-fields";
import { EditWorkerForm } from "../edit-worker-form";

export default async function EditWorkerPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  const worker = await getWorkerDetail(companyId, workerId);

  if (!worker) notFound();

  const uniformSizes = asUniformSizes(worker.uniformSizes);

  return (
    <EditWorkerForm
      workerId={worker.id}
      worker={{
        name: worker.user.name,
        email: worker.user.email,
        phone: worker.user.phone ?? "",
        idNumber: worker.idNumber ?? "",
        nationality: worker.nationality ?? "",
        birthDate: worker.birthDate ? worker.birthDate.toISOString().slice(0, 10) : "",
        address: worker.address ?? "",
        maritalStatus: worker.maritalStatus ?? "",
        hasChildren: worker.hasChildren,
        childrenCount: worker.childrenCount ?? 0,
        photoUrl: worker.photoUrl ?? "",
        education: worker.education ?? "",
        courses: asStringArray(worker.courses),
        languages: asStringArray(worker.languages),
        specialties: worker.specialties,
        experienceYears: worker.experienceYears ?? 0,
        previousEmployers: asEmployers(worker.previousEmployers),
        licenses: asStringArray(worker.licenses),
        // Nunca se envía al navegador si el rol no es ADMIN — no solo se oculta en la UI.
        hourlyRate: user.role === "ADMIN" && worker.hourlyRate ? Number(worker.hourlyRate) : undefined,
        hasVehicle: worker.hasVehicle,
        vehicleType: worker.vehicleType ?? "",
        uniformShirtSize: uniformSizes.shirt,
        uniformPantsSize: uniformSizes.pants,
        uniformShoeSize: uniformSizes.shoes,
        emergencyContactName: worker.emergencyContactName ?? "",
        emergencyContactPhone: worker.emergencyContactPhone ?? "",
        allergies: worker.healthInfo?.allergies ?? "",
        conditions: worker.healthInfo?.conditions ?? "",
      }}
      ratingAverage={worker.ratingAverage.toString()}
      ratingCount={worker.ratingCount}
      documents={worker.documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        issuedAt: doc.issuedAt ? doc.issuedAt.toISOString().slice(0, 10) : "",
        expiresAt: doc.expiresAt ? doc.expiresAt.toISOString().slice(0, 10) : "",
      }))}
      availabilitySlots={worker.availabilitySlots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))}
      viewerRole={user.role}
    />
  );
}
