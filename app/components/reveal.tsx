"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

/* ============================================================
 * Reveal — scroll-triggered entrance animation.
 * Wraps content; when it scrolls into view it fades/slides/
 * flips in. Works everywhere (server components can use it).
 * ============================================================ */

type Variant = "up" | "left" | "right" | "zoom" | "flip" | "blur";

const VARIANT_CLASS: Record<Variant, string> = {
  up: "reveal reveal-up",
  left: "reveal reveal-left",
  right: "reveal reveal-right",
  zoom: "reveal reveal-zoom",
  flip: "reveal reveal-flip",
  blur: "reveal reveal-blur",
};

export default function Reveal({
  children,
  variant = "up",
  delay = 0, // 0-5 → pre-set transition delays
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("revealed");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={`${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`}
      data-delay={delay || undefined}
      style={style}
    >
      {children}
    </Component>
  );
}
