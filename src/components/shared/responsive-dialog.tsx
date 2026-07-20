/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Mismo modal en desktop (Dialog centrado) y mobile (Drawer desde abajo,
 * más cómodo de alcanzar con el pulgar y de usar con el teclado abierto).
 * Los nombres coinciden 1:1 con los de "@/components/ui/dialog" — para
 * hacer un modal responsivo basta con cambiar el import, sin tocar el JSX.
 */
export function ResponsiveDialog(props: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile();
  return isMobile ? <Drawer {...props} /> : <Dialog {...props} />;
}

export function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerTrigger {...props} /> : <DialogTrigger {...props} />;
}

export function ResponsiveDialogContent(props: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerContent {...props} /> : <DialogContent {...props} />;
}

export function ResponsiveDialogHeader(props: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />;
}

export function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />;
}

export function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerTitle {...props} /> : <DialogTitle {...props} />;
}

export function ResponsiveDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerDescription {...props} /> : <DialogDescription {...props} />;
}

export function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />;
}
