/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell({ href, count }: { href: string; count: number }) {
  const previousCount = useRef(count);
  const [shouldBounce, setShouldBounce] = useState(false);

  useEffect(() => {
    if (count > previousCount.current) {
      setShouldBounce(true);
      const timeout = setTimeout(() => setShouldBounce(false), 500);
      previousCount.current = count;
      return () => clearTimeout(timeout);
    }
    previousCount.current = count;
  }, [count]);

  return (
    <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones" asChild>
      <Link href={href}>
        <motion.span
          animate={shouldBounce ? { rotate: [0, -12, 10, -6, 0] } : { rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex"
        >
          <Bell className="size-5" />
        </motion.span>
        <AnimatePresence>
          {count > 0 ? (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-danger-foreground"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </Link>
    </Button>
  );
}
