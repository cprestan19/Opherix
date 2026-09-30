-- Catálogo de especialidades por tenant (reemplaza el enum "Specialty") —
-- fase EXPAND: puramente aditiva, no toca las columnas/tipo enum viejos
-- todavía (specialty/specialties, tipo "Specialty"). El código desplegado en
-- el momento de correr esta migración sigue leyendo/escribiendo el enum sin
-- verse afectado. La limpieza destructiva (drop de columnas/tipo/índice GIN
-- viejos, NOT NULL final) va en una migración "specialty_catalog_contract"
-- separada, a correr días después del deploy del código que ya usa
-- specialtyId, una vez confirmada la estabilidad en producción.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0. El tipo enum "Specialty" ocupa el mismo namespace que una tabla del
--    mismo nombre en Postgres — se renombra para poder crear la tabla nueva
--    ya con el nombre final "Specialty". Las columnas que todavía lo usan
--    (specialty/specialties en las 3 tablas + Worker) siguen intactas, solo
--    cambia el nombre del tipo. specialty_catalog_contract hace el DROP TYPE
--    final una vez migrado todo el código.
ALTER TYPE "Specialty" RENAME TO "Specialty_legacy_enum";

-- 1. Tabla Specialty — catálogo por companyId. Columna "code" transitoria,
--    solo para mapear los 8 valores del enum viejo durante el backfill de
--    esta misma migración; se elimina al final (no existe en schema.prisma).
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Specialty_companyId_archivedAt_idx" ON "Specialty"("companyId", "archivedAt");

ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Semilla: las 8 especialidades actuales, para cada empresa ya existente
--    (mismo texto que specialtyLabels en src/lib/validations/worker-application.ts).
INSERT INTO "Specialty" ("id", "companyId", "name", "code", "updatedAt")
SELECT gen_random_uuid()::text, c."id", v.name, v.code, CURRENT_TIMESTAMP
FROM "Company" c
CROSS JOIN (VALUES
    ('WAITER', 'Mesero/a'),
    ('BARTENDER', 'Bartender'),
    ('HOST', 'Anfitrión/a'),
    ('COOK', 'Ayudante de cocina'),
    ('SECURITY', 'Seguridad'),
    ('CLEANING', 'Limpieza'),
    ('LOGISTICS', 'Logística'),
    ('OTHER', 'Otro')
) AS v(code, name);

-- 3. Tabla puente WorkerSpecialty (reemplaza Worker.specialties Specialty[]).
CREATE TABLE "WorkerSpecialty" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkerSpecialty_workerId_specialtyId_key" ON "WorkerSpecialty"("workerId", "specialtyId");

CREATE INDEX "WorkerSpecialty_specialtyId_idx" ON "WorkerSpecialty"("specialtyId");

ALTER TABLE "WorkerSpecialty" ADD CONSTRAINT "WorkerSpecialty_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerSpecialty" ADD CONSTRAINT "WorkerSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Backfill: Worker.specialties (enum[]) -> WorkerSpecialty.
INSERT INTO "WorkerSpecialty" ("id", "workerId", "specialtyId")
SELECT gen_random_uuid()::text, w."id", s."id"
FROM "Worker" w
CROSS JOIN LATERAL unnest(w."specialties") AS spec(code)
JOIN "Specialty" s ON s."companyId" = w."companyId" AND s."code" = spec.code::text;

-- 5. ClientSpecialtyRate: specialtyId (obligatoria, mismo criterio que la
--    columna "specialty" original).
ALTER TABLE "ClientSpecialtyRate" ADD COLUMN "specialtyId" TEXT;

UPDATE "ClientSpecialtyRate" r SET "specialtyId" = s."id"
FROM "Specialty" s
WHERE s."companyId" = r."companyId" AND s."code" = r."specialty"::text;

ALTER TABLE "ClientSpecialtyRate" ALTER COLUMN "specialtyId" SET NOT NULL;

ALTER TABLE "ClientSpecialtyRate" ADD CONSTRAINT "ClientSpecialtyRate_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ClientSpecialtyRate_clientId_specialtyId_key" ON "ClientSpecialtyRate"("clientId", "specialtyId");

-- 6. EventStaffRequirement: specialtyId (obligatoria) — companyId se alcanza
--    vía Event, no es columna directa de esta tabla.
ALTER TABLE "EventStaffRequirement" ADD COLUMN "specialtyId" TEXT;

UPDATE "EventStaffRequirement" req SET "specialtyId" = s."id"
FROM "Specialty" s, "Event" e
WHERE e."id" = req."eventId" AND s."companyId" = e."companyId" AND s."code" = req."specialty"::text;

ALTER TABLE "EventStaffRequirement" ALTER COLUMN "specialtyId" SET NOT NULL;

ALTER TABLE "EventStaffRequirement" ADD CONSTRAINT "EventStaffRequirement_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "EventStaffRequirement_specialtyId_idx" ON "EventStaffRequirement"("specialtyId");

-- 7. WorkerAssignment: specialtyId (opcional, igual que la columna original).
ALTER TABLE "WorkerAssignment" ADD COLUMN "specialtyId" TEXT;

UPDATE "WorkerAssignment" wa SET "specialtyId" = s."id"
FROM "Specialty" s, "Event" e
WHERE e."id" = wa."eventId" AND s."companyId" = e."companyId"
  AND wa."specialty" IS NOT NULL AND s."code" = wa."specialty"::text;

ALTER TABLE "WorkerAssignment" ADD CONSTRAINT "WorkerAssignment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "WorkerAssignment_specialtyId_idx" ON "WorkerAssignment"("specialtyId");

-- 8. La columna transitoria "code" ya cumplió su función de mapeo.
ALTER TABLE "Specialty" DROP COLUMN "code";
