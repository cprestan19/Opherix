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

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

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
          if (user.status !== "ACTIVE") return null;
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          await Promise.all([
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            }),
            prisma.company.update({
              where: { id: user.companyId },
              data: { lastAccessedAt: new Date() },
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

        const isPlatformAdminValid = await bcrypt.compare(password, platformAdmin.passwordHash);
        if (!isPlatformAdminValid) return null;

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
        }
        return token;
      }

      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.clientId = user.clientId;
        token.workerStatus = user.workerStatus;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.clientId = token.clientId;
        session.user.workerStatus = token.workerStatus;
      }
      return session;
    },
  },
});
