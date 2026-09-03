"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* Replays a 3D page-in animation every time the route changes. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="pc-page-anim">
      {children}
    </div>
  );
}
