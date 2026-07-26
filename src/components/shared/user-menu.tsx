/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(auth)/actions";

interface UserMenuProps {
  name: string;
  email: string;
  image?: string;
  roleLabel: string;
  profileHref?: string;
}

export function UserMenu({ name, email, image, roleLabel, profileHref }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none hover:bg-white/10 md:hover:bg-secondary">
        <Avatar className="size-8">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start leading-none md:flex">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </div>
        <ChevronDown className="size-4 text-white/70 md:text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profileHref ? (
          <DropdownMenuItem asChild>
            <a href={profileHref} className="gap-2">
              <UserRound className="size-4" /> Mi perfil
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild variant="destructive">
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
