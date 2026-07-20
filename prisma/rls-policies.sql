-- Row-Level Security de refuerzo para el aislamiento multi-tenant (CLAUDE.md §9.10).
--
-- ESTADO: este script está listo para aplicarse pero AÚN NO está integrado con la
-- capa de aplicación. La app hoy llama a `prisma.<modelo>.findMany(...)` directo
-- sobre el cliente singleton (`src/lib/prisma.ts`), sin envolver cada request en
-- una transacción que fije `app.current_company_id` por sesión — que es lo que
-- estas políticas requieren vía `current_setting()`. Aplicar este script sin ese
-- cambio bloquearía TODAS las queries (current_setting sin default lanza error).
--
-- Para activarlo de verdad hace falta:
--   1. Correr este script contra la base de datos (después de la migración inicial).
--   2. Crear un helper `withTenantContext(companyId, fn)` que ejecute
--      `SET LOCAL app.current_company_id = '<companyId>'` dentro de un
--      `prisma.$transaction(async (tx) => { ...; return fn(tx); })`.
--   3. Migrar los repositorios (src/repositories/*.ts) para recibir el `tx` en
--      vez de usar el `prisma` global directamente.
-- Es un cambio de arquitectura no trivial — se documenta aquí en vez de dejarlo
-- a medias para no dar una falsa sensación de que ya hay una segunda capa de
-- seguridad activa cuando hoy el único enforcement real es el filtro por
-- companyId en cada repositorio (ya presente en todo el código).

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Worker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkerDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_user ON "User"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_worker ON "Worker"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_client ON "Client"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_event ON "Event"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_document ON "WorkerDocument"
  USING (EXISTS (
    SELECT 1 FROM "Worker" w
    WHERE w.id = "WorkerDocument"."workerId"
      AND w."companyId" = current_setting('app.current_company_id')::text
  ));

CREATE POLICY tenant_isolation_payment ON "PaymentRecord"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_invoice ON "ClientInvoice"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_audit ON "AuditLog"
  USING ("companyId" = current_setting('app.current_company_id')::text);

CREATE POLICY tenant_isolation_notification ON "Notification"
  USING ("companyId" = current_setting('app.current_company_id')::text);
