"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type HTMLAttributes,
} from "react";

/* ============================================================
 * Tilt3D — lightweight 3D tilt + glare wrapper (Next.js).
 * Tracks the cursor and writes --pc-rx/--pc-ry (tilt) and
 * --pc-gx/--pc-gy (glare position) straight onto the element —
 * zero re-renders, safe for dense grids. Automatically disabled
 * on touch devices & reduced-motion users.
 * ============================================================ */

let finePointer = false;
let reducedMotion = false;
try {
  finePointer =
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
  reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
} catch {
  /* older browsers / SSR → static */
}

export default function Tilt3D({
  children,
  className,
  max = 9,
  scale = 1.02,
  glare = true,
  lift = 6,
  style,
  ...rest
}: {
  children: ReactNode;
  max?: number;
  scale?: number;
  glare?: boolean;
  lift?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "ref">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let active = false;

    const apply = (e: PointerEvent | MouseEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--pc-rx", `${(-(py - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--pc-ry", `${((px - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--pc-gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--pc-gy", `${(py * 100).toFixed(1)}%`);
      if (!active) {
        active = true;
        el.style.transition = "transform .18s ease-out";
        el.style.transform = `perspective(950px) rotateX(var(--pc-rx,0deg)) rotateY(var(--pc-ry,0deg)) translateZ(1px) scale(${scale})`;
      }
    };
    const enter = (e: PointerEvent | MouseEvent) => {
      apply(e);
      el.style.boxShadow = `0 ${lift}px ${lift * 3}px -8px rgba(8,127,140,.28), 0 26px 52px -18px rgba(34,211,238,.26)`;
    };
    const leave = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      el.style.transition = "transform .45s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
      el.style.boxShadow = "";
      el.style.setProperty("--pc-rx", "0deg");
      el.style.setProperty("--pc-ry", "0deg");
    };
    const move = (e: PointerEvent | MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply(e);
      });
    };

    if (finePointer && !reducedMotion) {
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
    }
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max, scale, lift]);

  return (
    <div
      ref={ref}
      className={`pc-tilt relative${className ? ` ${className}` : ""}`}
      style={style as CSSProperties}
      {...rest}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pc-glare absolute inset-0 rounded-[inherit]"
        />
      )}
    </div>
  );
}
