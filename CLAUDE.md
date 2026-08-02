# OPHERIX — Contexto persistente del proyecto

> Este archivo es la instrucción maestra del proyecto. Se carga automáticamente en cada sesión de Claude Code dentro de este repo. No lo borres ni lo resumas — sirve de fuente de verdad para arquitectura, negocio y diseño.

## 0. Rol y forma de trabajar

Actúa como Arquitecto de Software Senior (20+ años) desempeñando simultáneamente: Arquitecto de Software, Analista Funcional, Analista de Procesos de Negocio, Diseñador UX/UI, Full Stack Senior, Arquitecto de BD, Seguridad Informática, Automatización de Procesos, QA, Escalabilidad/Rendimiento, Consultor de Producto.

Metodología obligatoria:
1. Identifica vacíos funcionales/técnicos/UX antes de implementar literalmente.
2. Ante un problema potencial: detéctalo → explica por qué → propone solución → impleméntala si es de bajo riesgo; pregunta primero si es una decisión de negocio o cambio de alcance grande.
3. Nunca asumas que una solicitud está completa — complétala con mejores prácticas de software empresarial.
4. Valida en cada entrega: arquitectura, flujo de negocio, flujo de usuario, seguridad, permisos, validaciones, manejo de errores, auditoría, rendimiento, escalabilidad, mantenibilidad, compatibilidad móvil, accesibilidad, UX.
5. Código completo y listo para ejecutar, salvo que se pida explícitamente un diff pequeño.

## 1. Qué es OPHERIX

SaaS comercial (no una app de reservas simple) para administración y contratación de personal temporal de eventos: meseros, saloneros, bartenders, limpieza, anfitriones, cocineros, seguridad, logística.

Nivel de producto: Linear / Notion / Vercel / Storee.ai — no ERP clásico.

**Multi-tenant desde el día 1.** Cada empresa (tenant) aísla usuarios, clientes, trabajadores, eventos, facturación, configuración y branding. Mismo patrón que DojoMaster: `companyId` en cada modelo relevante, resuelto vía `getEffectiveCompanyId()` en cada request — nunca confiado solo del lado del cliente.

## 2. Stack tecnológico (confirmado)

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, Lucide React, Framer Motion.
- **Backend:** Next.js API Routes + Server Actions, Prisma ORM.
- **Base de datos:** PostgreSQL en Neon (serverless, branching de DB por PR/entorno).
- **Auth:** Auth.js (NextAuth v5), JWT + roles.
- **Validación/Estado/Tablas/Gráficas:** React Hook Form + Zod, TanStack Query, TanStack Table, Recharts.
- **Imágenes:** ImageKit (fotos de trabajadores, documentos, selfies de check-in, y **todo asset de marca/UI** — logo, íconos ilustrativos, etc.). Elegido sobre Cloudinary: free tier 20GB bandwidth + 3GB storage separados, primer escalón pago ~$9/mes. **Regla obligatoria e innegociable: ninguna imagen vive en el código como base64/data-URI, ni como archivo estático en `public/` (salvo los íconos de manifest PWA, que por convención de instalabilidad se sirven same-origin).** Toda imagen nueva se sube a ImageKit (vía el endpoint firmado en `src/app/api/imagekit/auth/route.ts` + `@imagekit/react`'s `upload()`, o subida directa a la API si es un asset de marca fijo) y se referencia por su URL de `https://ik.imagekit.io/eventstaff/...` — nunca embebida ni versionada en el repo. `next.config.ts` tiene `images.remotePatterns` apuntando a ese host.
- **Push:** Firebase Cloud Messaging (limitaciones iOS PWA — ver §9.3).
- **Mapas:** Google Maps API.
- **Calendario:** React Big Calendar.
- **Exportaciones:** Excel, PDF.
- **Infra:** Vercel (hosting + Vercel Cron Jobs) + GitHub (CI/CD vía Vercel Git integration; GitHub Actions solo para pasos que Vercel no cubra, ej. migraciones Prisma controladas) + Neon (branching por PR/preview).

**NO se integra ninguna pasarela de pago (no Stripe, no PagueloFacil).** Los pagos son solo registro/cálculo por el Administrador — el dinero se mueve fuera de la plataforma (ver §6.8, §9.1).

## 3. Diseño — lineamientos visuales

Inspiración: Storee.ai, Linear.app, Vercel, Notion. Minimalista, mucho espacio en blanco, tarjetas elegantes, bordes redondeados, sombras suaves, animaciones con Framer Motion. Nada de Bootstrap/AdminLTE/Metronic.

Paleta (como CSS variables / tokens Tailwind, nunca hardcodeada). **Actualizada tras adoptar la marca Opherix**: el color principal es ahora **violeta** (escala oficial "violet" de Radix Colors, paso 9), no el azul original — el azul pasa a ser el acento secundario (`--indigo`), conservando el espíritu de dos colores del logo (cian→azul→violeta):

| Uso | Color | Fuente |
|---|---|---|
| Background | `#FFFFFF` | fijo |
| Secondary Background | `#F8FAFC` | fijo |
| **Primary** | `#5F3CDD` | Radix Colors `violet-9` |
| Acento secundario (índigo) | `#2563EB` | azul original, ahora secundario |
| Success | `#22C55E` | fijo |
| Warning | `#F59E0B` | fijo |
| Danger | `#EF4444` | fijo |
| Text | `#0F172A` | fijo |
| Secondary Text | `#64748B` | fijo |

La escala completa de Radix Colors "violet" (12 pasos + variantes alpha/P3) vive en `src/app/globals.css` como utilidades Tailwind (`bg-violet-3`, `text-violet-11`, etc.), no solo el paso 9 usado como `--primary`. **Regla permanente: violeta es el único color de marca/acento de la app — no reintroducir azul, navy ni ningún otro hue como color primario en ningún portal.** El azul (`--indigo`, `#2563EB`) sobrevive únicamente como acento secundario ya documentado y como segundo hue categórico en gráficas multi-serie (nunca como fondo, CTA o branding).

**REGLA OBLIGATORIA E INNEGOCIABLE: el contenido (fondo principal, tarjetas, popovers, diálogos) siempre blanco/claro. NO dark mode conmutable ni forzado por el SO, en los 4 portales, sin excepción.** `prefers-color-scheme: dark` se ignora a propósito — el tema claro se fuerza explícitamente aunque el SO/navegador pida oscuro. Cualquier componente shadcn/ui con dark mode por defecto debe desactivarse explícitamente.

**Excepción única y deliberada — sidebar de navegación:** el sidebar usa un color de marca fijo (`--sidebar: var(--violet-12)`, el paso más oscuro de la escala violet, definido en `globals.css`) igual que el mockup de referencia de Opherix. Esto NO es "dark mode": nunca reacciona a `prefers-color-scheme` ni a un toggle de usuario, es un color de marca constante como el navy de Linear/Vercel en su propio branding. Ninguna otra superficie (contenido, tarjetas, modales, navbar superior) debe ser oscura.

## 4. Flujo general (8 pasos canónicos)

1. **Registro** (Aspirante) — postulación: datos personales, experiencia, estudios, disponibilidad, documentos.
2. **Perfil Profesional** (Aspirante) — CV generado automáticamente del formulario.
3. **Revisión** (Administrador) — aprueba/rechaza candidatos.
4. **Disponibilidad** (Trabajador) — calendario semanal con toggle por franja.
5. **Solicitud de Evento** (Cliente) — fecha, hora, lugar, tipo, personal requerido por rol/cantidad. **El Cliente ya no tiene cuenta ni portal con login** (cambio de 2026-07: reemplaza el antiguo portal `/cliente/*` autenticado) — solicita desde el link público `/solicitar/[companySlug]`, sin ningún paso de verificación por correo (decisión explícita: cero intervención de correos en este flujo) — solo Turnstile + rate limiting por correo/IP contra spam. Al enviar el formulario queda con una cookie de "recuérdame sin contraseña" (`ClientAccessToken`, 7 días) para volver a ver el estado en `/solicitar/[companySlug]/estado`, donde puede editar su solicitud mientras siga `REQUESTED`. El registro `Client` (empresa/contacto) se sigue creando igual que antes, solo que sin `User`/contraseña asociada — el Administrador aún puede darlo de alta manualmente desde `/admin/clientes` si lo prefiere. El correo sí se usa para avisarle cuando el Administrador confirma o rechaza la solicitud (única notificación por correo de todo este flujo).
6. **Asignación** (Administrador) — asigna personal disponible y confirma.
7. **Confirmación** (Trabajador) — acepta o rechaza la asignación.
8. **Evento en Curso** (Trabajador) — check-in, ejecución, check-out.

Cada paso: dispara notificación (push + email) al actor siguiente; queda en `AuditLog` (quién, cuándo, qué, IP/dispositivo); es reversible/cancelable con motivo sin romper historial (soft-delete/estado, nunca borrado físico).

## 5. Roles y portales

Roles: Administrador, Supervisor, Cliente, Trabajador, Aspirante.

Portales: Administrador (control total, asignaciones, reportes, facturación, config), Trabajador (asignaciones, disponibilidad, check-in/out, pagos, perfil), Aspirante (postulación, documentos, CV, seguimiento, notificaciones).

**Cliente ya no es un portal autenticado** — no tiene `layout`/navegación propia ni sesión NextAuth. Su única superficie es la pública `/solicitar/[companySlug]` (solicitar + verificar OTP) y `/solicitar/[companySlug]/estado` (ver/editar mientras esté pendiente), ambas sin login — ver §4 paso 5. Toda la gestión del lado del negocio (asignar personal, confirmar/rechazar, facturar) sigue siendo exclusiva del Administrador desde `/admin/eventos` y `/admin/clientes`.

**Aspirante es un estado, no un rol fijo.** Al aprobarse (paso 3), la cuenta migra `Aspirante → Trabajador` conservando el mismo `userId` e historial. Máquina de estados: `PENDING_REVIEW → APPROVED → ACTIVE / REJECTED` — nunca una tabla separada que obligue a recrear el usuario.

## 6. Módulos funcionales

- **6.1 Dashboard:** visual, sin tablas al abrir. Tarjetas: Eventos Hoy, Personal Disponible, Personal Trabajando, Solicitudes Pendientes, Clientes Activos, Facturación del Mes, Horas Trabajadas, Pagos Pendientes. Debajo: calendario, eventos próximos, trabajadores disponibles, gráficas, actividad reciente.
- **6.2 Reclutamiento:** formulario extenso (foto, cédula, nacimiento, dirección, teléfono, email, estado civil, hijos, escolaridad, cursos, idiomas, experiencia, empresas anteriores, referencias, licencias, vehículo/moto propio, disponibilidad, tallas uniforme, enfermedades/alergias, contacto emergencia, documentos). Genera perfil CV elegante (HTML→imagen/PDF, patrón html2canvas + jsPDF).
- **6.3 Personal (Talento):** perfil visual — foto grande, nombre, edad, especialidad, experiencia, idiomas, calificación, disponibilidad, documentos, certificados, historial, comentarios, evaluaciones.
- **6.4 Clientes:** registro de contacto (empresa, nombre, correo, teléfono) gestionado por el Administrador desde `/admin/clientes` — sin cuenta de acceso. La solicitud de evento la hace el propio Cliente sin cuenta desde `/solicitar/[companySlug]` (§4 paso 5); el historial/facturas los ve y gestiona el Administrador, no el Cliente.
- **6.5 Eventos:** crear (ubicación, fecha, hora inicio/fin, cantidad por tipo de personal, observaciones), asignar trabajadores, gestionar confirmaciones, check-in/out.
- **6.6 Disponibilidad:** días/horas, vacaciones, permisos, ausencias — por trabajador, vista calendario.
- **6.7 Check-In:** GPS, QR, código de supervisor o selfie. Hora entrada/salida.
- **6.8 Pagos (registro contable, NO procesamiento):** NO mueve dinero real. Config pago por hora/extra/domingos/feriados/bonos/descuentos. Cálculo automático desde horas confirmadas (check-in/out) por periodo. Admin marca manualmente `PENDIENTE → PAGADO` (fecha + método libre: efectivo/transferencia/cheque). Export Excel/PDF por trabajador y consolidado. Ningún dato de tarjeta/cuenta bancaria ni procesamiento vive aquí — reduce alcance PCI.
- **6.9 Documentos:** cédula, currículum, carnet salud, manipulación alimentos, licencias, certificados. Alertas automáticas de vencimiento próximo.
- **6.10 Notificaciones:** push (Firebase), email, recordatorios, confirmaciones, cambios de horario, asignaciones.
- **6.11 Reportes:** horas trabajadas, eventos realizados, clientes, facturación, trabajadores más solicitados, puntualidad, ausencias, ranking.
- **6.12 Configuración:** branding por empresa (multi-tenant), tarifas, feriados/reglas de pago por país, roles y permisos.

## 7. Arquitectura y código

Clean Architecture: separación `ui/components`, `services`, `repositories (Prisma)`, `api`, `domain`, `types`, `utils`, `hooks`. 100% TypeScript, SOLID, sin duplicación. Comentarios solo donde aporten valor real. Componentes reutilizables entre portales (primitives compartidos, no vistas completas). PWA instalable Android/iPhone, responsive completo.

## 8. Propiedad Intelectual y Autoría

**Opherix es propiedad intelectual exclusiva de Cristhian Paul Prestán.** No es software libre ni de código abierto — todo el código, diseño y documentación de este repositorio pertenecen únicamente al autor. Estas reglas son obligatorias e innegociables, igual que las de tema claro (§3) o aislamiento multi-tenant (§9.10):

1. **Header de licencia obligatorio en cada archivo de código fuente** (`.ts`/`.tsx` bajo `src/`, `prisma/schema.prisma`, y los config de raíz como `next.config.ts`/`prisma.config.ts`/`eslint.config.mjs`/`postcss.config.mjs` — no aplica a `src/generated/` ni a `next-env.d.ts`, que Prisma/Next regeneran automáticamente y sobrescribirían cualquier header). Como comentario de bloque al inicio del archivo (antes de cualquier `"use client"`/`"use server"`/import — un comentario líder no rompe la directive prologue):
   ```ts
   /**
    * OPHERIX — Plataforma SaaS de gestión de personal para eventos
    * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
    * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
    * distribución o uso no autorizado, total o parcial, sin consentimiento
    * expreso por escrito del autor.
    */
   ```
   En `prisma/schema.prisma` (que no soporta comentarios de bloque) se usa el mismo texto con `//` línea por línea.

2. **`LICENSE` en la raíz del repo** (propietaria, no MIT/Apache/etc.):
   ```
   Copyright (c) 2026 Cristhian Paul Prestán

   Todos los derechos reservados.

   Este software y su código fuente son propiedad exclusiva de Cristhian Paul
   Prestán. Queda prohibida su copia, modificación, distribución, sublicencia,
   venta o uso, total o parcial, sin autorización previa y por escrito del
   titular de los derechos.
   ```

3. **`package.json`** debe declarar siempre:
   ```json
   {
     "name": "opherix",
     "author": "Cristhian Paul Prestán",
     "license": "UNLICENSED",
     "private": true
   }
   ```

4. **Footer de autoría en los 4 portales, presente en el código pero oculto visualmente** (decisión explícita del autor, 2026-08-02 — reemplaza la redacción original de este punto, que lo pedía visible). Administrador, Cliente, Trabajador, Aspirante (usa el shell de Trabajador) viven sobre el mismo `PortalShell` compartido (`src/components/shared/portal-shell.tsx`), así que un único footer ahí cubre los cuatro — se mantiene en el JSX (nunca borrarlo) pero con `hidden` para que no se muestre a ningún usuario, ni siquiera a lectores de pantalla:
   ```tsx
   <footer className="hidden py-4 text-center text-xs text-muted-foreground">
     © {new Date().getFullYear()} Opherix. Desarrollado por Cristhian Prestán.
   </footer>
   ```
   La autoría/propiedad intelectual sigue probada por los otros tres mecanismos de esta sección (headers de licencia por archivo, `LICENSE`, `package.json`) — el footer visible dejó de ser necesario para eso.

Estos cuatro puntos se generan en el **paso 1** del orden de construcción (§10) de cualquier setup nuevo del proyecto — no se dejan para el final.

## 9. Vacíos detectados y solución (decisiones ya tomadas — no relitigar)

1. **Sin pasarela de pago.** Confirmado: solo registro, nunca procesamiento. Elimina alcance PCI-DSS y el problema de entidad legal que tuvimos con Stripe/DojoMaster.
2. **Datos sensibles de salud:** enfermedades/alergias van en tabla separada `WorkerHealthInfo`, acceso solo Administrador/Supervisor, nunca expuesta al Cliente, cifrada en reposo si el proveedor lo permite.
3. **Push en iOS PWA:** FCM funciona sin fricción en Android; en iOS solo si la PWA está en pantalla de inicio (Safari 16.4+) y con comportamiento distinto. No depender 100% de push para eventos time-sensitive — reforzar con WhatsApp/SMS de respaldo.
4. **Cron en serverless:** usar Vercel Cron Jobs (o Trigger.dev/QStash si se necesita más granularidad) apuntando a API routes para verificación diaria (vencimiento de documentos, cierres de nómina).
5. **Conflictos de horario:** un trabajador no puede asignarse a dos eventos que se solapen — reutilizar el algoritmo de solapamiento de rangos de fecha/hora del proyecto Torneo Katana, a nivel de `WorkerAssignment`.
6. **Reglas de pago por país:** tabla `PayRuleSet` por tenant/país configurable (domingos/feriados no son iguales en Panamá/Colombia/RD/Guatemala) — nunca hardcodeada.
7. **Moderación de calificaciones:** calificaciones ≤2/5 quedan en revisión del Administrador antes de impactar el perfil público del trabajador.
8. **Aspirante→Trabajador:** máquina de estados, no tabla duplicada (ver §5).
9. **Auditoría transversal:** toda acción de negocio relevante en tabla `AuditLog` genérica (`actorId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`) — no logs dispersos por módulo.
10. **Aislamiento multi-tenant real:** cada query Prisma filtra por `companyId` a nivel de repositorio/servicio (así implementado en todo `src/repositories/*.ts`), nunca solo en el frontend. Row-Level Security en Postgres/Neon como capa adicional de defensa: las políticas están listas en `prisma/rls-policies.sql`, pero **no están activas** — aplicarlas requiere primero introducir un helper `withTenantContext()` que envuelva cada request en una transacción con `SET LOCAL app.current_company_id`, y migrar los repositorios para usar ese `tx` en vez del cliente Prisma global. Ver el encabezado de ese archivo para el detalle; no se dejó a medias a propósito.

## 10. Orden de construcción

1. Setup monorepo: Next.js 16 + Prisma + Neon + Auth.js + Clean Architecture + `LICENSE`/`package.json`/headers de propiedad intelectual (§8).
2. Modelo de datos multi-tenant (Company, User, Role, Worker, Client, Event, Assignment, Availability, Document, Payment, AuditLog).
3. Auth + roles + portal shells (layout por rol, navegación, guards de ruta).
4. Módulo Reclutamiento + generación de perfil CV (diferenciador visual — priorizar).
5. Módulo Personal + Disponibilidad.
6. Módulo Eventos + Solicitud (Cliente) + Asignación (Admin) + Confirmación (Trabajador).
7. Check-in/out (GPS + QR + selfie).
8. Módulo Pagos + reglas por país + exportaciones.
9. Documentos + alertas de vencimiento (Vercel Cron).
10. Notificaciones (Firebase + email).
11. Reportes + Dashboard final.
12. Hardening: RLS, auditoría completa, accesibilidad, verificación de tema claro forzado, QA end-to-end.

---

*Este archivo se actualiza a medida que el proyecto avanza. Ver también `.env.example` para variables de entorno requeridas (Neon, ImageKit, Firebase, Google Maps).*
