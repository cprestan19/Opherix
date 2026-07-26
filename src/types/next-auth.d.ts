/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { UserRole, WorkerStatus } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

/**
 * Rol efectivo de la sesión. "PLATFORM_ADMIN" no es un UserRole de Prisma
 * a propósito: un admin de plataforma vive en la tabla `PlatformAdmin`,
 * separada de `User`, y no pertenece a ningún tenant (companyId).
 */
export type SessionRole = UserRole | "PLATFORM_ADMIN";

declare module "next-auth" {
  interface User {
    role: SessionRole;
    companyId?: string;
    clientId?: string;
    workerStatus?: WorkerStatus;
  }

  interface Session {
    user: {
      id: string;
      role: SessionRole;
      companyId?: string;
      clientId?: string;
      workerStatus?: WorkerStatus;
      /** false si la revalidación periódica (ver auth.ts) detectó la cuenta suspendida/borrada. */
      accountActive?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: SessionRole;
    companyId?: string;
    clientId?: string;
    workerStatus?: WorkerStatus;
    accountActive?: boolean;
    /** epoch ms de la última vez que el jwt callback confirmó el estado contra la BD. */
    lastValidatedAt?: number;
  }
}
