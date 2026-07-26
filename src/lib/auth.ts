/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import NextAuth, { type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { provisionCompanyForGoogleUser } from "@/services/self-signup.service";
import { logAudit } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Bloqueo por fuerza bruta (§ ninguna otra capa lo cubre — el proxy.ts solo
// exige sesión, no throttlea intentos de contraseña). 5 intentos fallidos
// bloquean la cuenta 15 minutos; se resetea en cualquier login exitoso.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

// El JWT (`session: { strategy: "jwt" }`) dura hasta 30 días por defecto sin
// volver a tocar la BD — esto acota cuánto puede quedar "stale" un claim de
// rol/companyId/estado tras un cambio hecho por un admin (ver jwt callback).
const JWT_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { worker: { select: { status: true } } },
        });

        if (user) {
          if (user.status !== "ACTIVE") {
            await logAudit({
              companyId: user.companyId,
              actorId: user.id,
              action: "LOGIN_BLOCKED",
              entityType: "User",
              entityId: user.id,
              metadata: { reason: "account_not_active" },
            });
            return null;
          }

          if (user.lockedUntil && user.lockedUntil > new Date()) {
            await logAudit({
              companyId: user.companyId,
              actorId: user.id,
              action: "LOGIN_BLOCKED",
              entityType: "User",
              entityId: user.id,
              metadata: { reason: "account_locked", lockedUntil: user.lockedUntil.toISOString() },
            });
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            const attempts = user.failedLoginAttempts + 1;
            const lockingNow = attempts >= MAX_FAILED_ATTEMPTS;
            await prisma.user.update({
              where: { id: user.id },
              data: lockingNow
                ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }
                : { failedLoginAttempts: attempts },
            });
            await logAudit({
              companyId: user.companyId,
              actorId: user.id,
              action: lockingNow ? "LOGIN_LOCKED" : "LOGIN_FAILED",
              entityType: "User",
              entityId: user.id,
              metadata: { reason: "invalid_password", attempts },
            });
            return null;
          }

          await Promise.all([
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
            }),
            prisma.company.update({
              where: { id: user.companyId },
              data: { lastAccessedAt: new Date() },
            }),
            logAudit({
              companyId: user.companyId,
              actorId: user.id,
              action: "LOGIN_SUCCESS",
              entityType: "User",
              entityId: user.id,
            }),
          ]);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image ?? undefined,
            role: user.role,
            companyId: user.companyId,
            clientId: user.clientId ?? undefined,
            workerStatus: user.worker?.status ?? undefined,
          };
        }

        // Sin match en User (tenant) — probar como admin de plataforma (§ sin tenant).
        const platformAdmin = await prisma.platformAdmin.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!platformAdmin) return null;

        if (platformAdmin.lockedUntil && platformAdmin.lockedUntil > new Date()) {
          return null;
        }

        const isPlatformAdminValid = await bcrypt.compare(password, platformAdmin.passwordHash);
        if (!isPlatformAdminValid) {
          const attempts = platformAdmin.failedLoginAttempts + 1;
          const lockingNow = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.platformAdmin.update({
            where: { id: platformAdmin.id },
            data: lockingNow
              ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }
              : { failedLoginAttempts: attempts },
          });
          return null;
        }

        await prisma.platformAdmin.update({
          where: { id: platformAdmin.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        return {
          id: platformAdmin.id,
          email: platformAdmin.email,
          name: platformAdmin.name,
          role: "PLATFORM_ADMIN",
        };
      },
    }),
    ...(isGoogleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;

      const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      if (existing) return true;

      // Primer login de este correo con Google: auto-aprovisiona su propia empresa.
      await provisionCompanyForGoogleUser(user.email, user.name ?? "", user.image ?? undefined);
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: { worker: { select: { status: true } } },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
          token.clientId = dbUser.clientId ?? undefined;
          token.workerStatus = dbUser.worker?.status ?? undefined;
          token.accountActive = dbUser.status === "ACTIVE";
          token.lastValidatedAt = Date.now();
        }
        return token;
      }

      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.clientId = user.clientId;
        token.workerStatus = user.workerStatus;
        token.accountActive = true;
        token.lastValidatedAt = Date.now();
        return token;
      }

      // No es el primer sign-in (`user` solo viene ahí) — el JWT dura hasta
      // 30 días (default de NextAuth) sin volver a tocar la BD, así que un rol
      // cambiado, una cuenta suspendida o un companyId movido seguirían
      // vigentes en la sesión ya emitida hasta que expire. Se revalida cada
      // pocos minutos en vez de confiar ciegamente en el claim viejo.
      const staleForMs = Date.now() - (token.lastValidatedAt ?? 0);
      if (staleForMs < JWT_REVALIDATE_INTERVAL_MS) return token;

      if (token.role === "PLATFORM_ADMIN") {
        const platformAdmin = await prisma.platformAdmin.findUnique({ where: { id: token.sub } });
        token.accountActive = Boolean(platformAdmin);
        token.lastValidatedAt = Date.now();
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        include: { worker: { select: { status: true } } },
      });
      if (!dbUser) {
        token.accountActive = false;
        token.lastValidatedAt = Date.now();
        return token;
      }

      token.role = dbUser.role;
      token.companyId = dbUser.companyId;
      token.clientId = dbUser.clientId ?? undefined;
      token.workerStatus = dbUser.worker?.status ?? undefined;
      token.accountActive = dbUser.status === "ACTIVE";
      token.lastValidatedAt = Date.now();
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.clientId = token.clientId;
        session.user.workerStatus = token.workerStatus;
        session.user.accountActive = token.accountActive ?? true;
      }
      return session;
    },
  },
});
