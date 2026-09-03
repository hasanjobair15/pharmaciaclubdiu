"use client";

import { useState } from "react";
import ThemeToggle from "./theme-toggle";

const links = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Committee", href: "/committee" },
  { name: "Events", href: "/events" },
  { name: "Academic", href: "/academic" },
  { name: "Routine", href: "https://pharmroutine-diu.vercel.app/" },
  { name: "Research", href: "/research" },
  { name: "Publications", href: "/publications" },
  { name: "Gallery", href: "/gallery" },
  { name: "News", href: "/news" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#0a0f1a]/95">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-4">

        {/* LOGO */}
        <a
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 shrink-0 items-center gap-3"
        >
          <img
            src="/pharmacialogo.png"
            alt="Pharmacia Club DIU"
            className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-[#0b1736] dark:text-white">
              PHARMACIA CLUB
            </p>

            <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:block">
              DIU · Department of Pharmacy
            </p>
          </div>
        </a>

        {/* DESKTOP NAVBAR */}
        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          {links.map((link) => {
            const isExternal = link.href.startsWith("http");

            return (
              <a
                key={link.href}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-[#0b1736] transition-colors hover:text-[#087f8c] dark:text-slate-100 dark:hover:text-[#087f8c]"
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* THEME TOGGLE */}
        <ThemeToggle />

        {/* JOIN US */}
        <a
          href="/contact"
          className="hidden shrink-0 rounded-full bg-[#0b1736] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#087f8c] lg:block"
        >
          Join Us
        </a>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#0b1736] transition hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 lg:hidden"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE NAVBAR */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 dark:border-slate-700 dark:bg-[#0a0f1a] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col">
            {links.map((link) => {
              const isExternal = link.href.startsWith("http");

              return (
                <a
                  key={link.href}
                  href={link.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-slate-100 py-3 text-sm font-medium text-[#0b1736] transition-colors hover:text-[#087f8c] dark:border-slate-800 dark:text-slate-100 dark:hover:text-[#087f8c]"
                >
                  {link.name}
                </a>
              );
            })}

            {/* MOBILE JOIN US */}
            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="mt-4 rounded-full bg-[#0b1736] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#087f8c]"
            >
              Join Us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}