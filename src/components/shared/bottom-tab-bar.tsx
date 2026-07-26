/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/components/shared/app-sidebar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface BottomTabBarProps {
  primaryItems: NavItem[];
  moreGroups?: NavGroup[];
}

/**
 * Navegación tipo app nativa para mobile: barra inferior fija con 4 accesos
 * directos + un 5to botón "Más" (drawer con el resto del menú), en vez del
 * sidebar/hamburguesa que se usa en desktop. Solo visible bajo el
 * breakpoint `md` — el sidebar de escritorio no se toca.
 */
export function BottomTabBar({ primaryItems, moreGroups = [] }: BottomTabBarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const hasMore = moreGroups.some((g) => g.items.length > 0);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const moreIsActive = hasMore && moreGroups.some((g) => g.items.some((item) => isActive(item.href)));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación principal"
    >
      {primaryItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className={cn("[&_svg]:size-5", active ? "text-primary" : "text-muted-foreground")}>
              {item.icon}
            </span>
            <span className="max-w-full truncate px-1">{item.title}</span>
          </Link>
        );
      })}

      {hasMore ? (
        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              moreIsActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-5" />
            <span>Más</span>
          </button>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Más opciones</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto p-4 pt-0">
              {moreGroups
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.label} className="flex flex-col gap-1">
                    <p className="px-2 text-xs font-medium text-muted-foreground">{group.label}</p>
                    {group.items.map((item) => (
                      <DrawerClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span className="[&_svg]:size-4.5">{item.icon}</span>
                          {item.title}
                        </Link>
                      </DrawerClose>
                    ))}
                  </div>
                ))}
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </nav>
  );
}
