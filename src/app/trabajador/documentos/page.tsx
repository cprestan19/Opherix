/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { listDocumentsForWorker } from "@/repositories/document.repository";
import { DocumentUploadForm } from "./upload-form";
import { DocumentList } from "./document-list";

export default async function DocumentosTrabajadorPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const documents = await listDocumentsForWorker(worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">Mantén tus documentos actualizados antes de que venzan.</p>
        </div>
        <DocumentUploadForm />
      </div>
      <DocumentList documents={documents} />
    </div>
  );
}
