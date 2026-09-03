import type { ReactNode } from "react";
import Reveal from "./reveal";

/* Colorful gradient banner used at the top of every inner page. */
const GRADIENTS = [
  "from-cyan-600 via-blue-700 to-indigo-800",
  "from-violet-700 via-fuchsia-700 to-pink-700",
  "from-amber-500 via-orange-600 to-rose-600",
  "from-emerald-600 via-teal-700 to-cyan-800",
  "from-sky-600 via-indigo-700 to-violet-800",
];

export default function PageHero({
  emoji,
  title,
  accent,
  subtitle,
  index = 0,
  children,
}: {
  emoji?: string;
  title: string;
  accent?: string;
  subtitle?: ReactNode;
  index?: number;
  children?: ReactNode;
}) {
  const grad = GRADIENTS[index % GRADIENTS.length];
  return (
    <section className={`pc-mesh relative overflow-hidden bg-gradient-to-br ${grad} text-white`}>
      <div className="blob blob-1 right-[-10%] top-[-40%] h-72 w-72 bg-white/15" />
      <div className="blob blob-2 left-[-8%] bottom-[-50%] h-80 w-80 bg-black/15" />
      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8">
        <Reveal variant="up">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
            {emoji && <span className="text-lg">{emoji}</span>} Pharmacia Club DIU
          </p>
        </Reveal>
        <Reveal variant="up" delay={1}>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            {title} {accent && <span className="pc-rainbow">{accent}</span>}
          </h1>
        </Reveal>
        {subtitle && (
          <Reveal variant="up" delay={2}>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{subtitle}</p>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
