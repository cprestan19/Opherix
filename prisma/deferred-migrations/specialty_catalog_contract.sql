-- NO EJECUTAR TODAVÍA — deliberadamente fuera de prisma/migrations/ para que
-- `prisma migrate deploy` no la recoja ni la aplique por accidente.
--
-- Fase CONTRACT del catálogo de especialidades por tenant (ver
-- prisma/migrations/20260930134418_specialty_catalog_expand). Limpieza
-- destructiva final: elimina las columnas/tipo enum "Specialty" viejos, ya
-- reemplazados por la tabla Specialty + specialtyId en todo el código.
--
-- Cuándo correrla: días después de haber desplegado a producción el código
-- que ya usa specialtyId en vez del enum (todo este PR), una vez confirmado
-- que no hay errores. Para aplicarla: mover este archivo a
-- prisma/migrations/<timestamp>_specialty_catalog_contract/migration.sql y
-- correr `npx prisma migrate deploy`.

-- 1. Worker.specialties (array nativo) ya no se usa — reemplazado por
--    WorkerSpecialty.
DROP INDEX IF EXISTS "Worker_specialties_idx";
ALTER TABLE "Worker" DROP COLUMN "specialties";

-- 2. ClientSpecialtyRate.specialty (enum) ya no se usa — reemplazado por
--    specialtyId.
DROP INDEX IF EXISTS "ClientSpecialtyRate_clientId_specialty_key";
ALTER TABLE "ClientSpecialtyRate" DROP COLUMN "specialty";

-- 3. EventStaffRequirement.specialty (enum) ya no se usa.
ALTER TABLE "EventStaffRequirement" DROP COLUMN "specialty";

-- 4. WorkerAssignment.specialty (enum) ya no se usa.
ALTER TABLE "WorkerAssignment" DROP COLUMN "specialty";

-- 5. El tipo enum ya no tiene ninguna columna que lo use.
DROP TYPE "Specialty_legacy_enum";
