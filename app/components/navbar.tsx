"use client";

import { useState } from "react";
import ThemeToggle from "./theme-toggle";

const links = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Committee", href: "/committee" },
  { name: "Events", href: "/events" },
  { name: "Academic", href: "/academic" },
  {
    name: "Routine",
    href: "https://pharmroutine-diu.vercel.app/",
  },
  { name: "Research", href: "/research" },
  { name: "Magazine", href: "/magazine" },
  { name: "Gallery", href: "/gallery" },
  { name: "News", href: "/news" },
  { name: "Alumni", href: "/alumni" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="
        sticky top-0 z-50
        border-b-2
        border-transparent
        [border-image:linear-gradient(90deg,#22d3ee,#818cf8,#f472b6,#fbbf24,#34d399)_1]
        bg-white/95
        shadow-sm
        backdrop-blur-xl
        transition-colors duration-300
        dark:bg-[#0a0f1a]/95
      "
    >
      <div
        className="
          mx-auto flex max-w-7xl
          items-center gap-3
          px-4 py-3
          sm:px-6
          lg:gap-6 lg:px-8 lg:py-4
        "
      >
        {/* LOGO + CLUB NAME */}
        <a
          href="/"
          onClick={() => setMenuOpen(false)}
          className="
            group
            flex min-w-0 shrink-0
            items-center gap-3
            no-underline
          "
        >
          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              overflow-hidden
              rounded-xl
              bg-white
              ring-1 ring-slate-200
              transition-all duration-300
              group-hover:-rotate-6 group-hover:scale-110
              group-hover:shadow-[0_10px_30px_-8px_rgba(8,127,140,.5)]
              sm:h-11 sm:w-11
              dark:bg-slate-900
              dark:ring-slate-700
            "
          >
            <img
              src="/pharmacialogo.png"
              alt="Pharmacia Club DIU"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-sm font-bold
                tracking-wide
                text-[#0b1736]
                transition-colors
                dark:text-white
              "
            >
              PHARMACIA CLUB
            </p>

            <p
              className="
                hidden
                text-[10px] font-medium
                uppercase tracking-[0.16em]
                text-slate-500
                sm:block
                dark:text-slate-400
              "
            >
              DIU · Department of Pharmacy
            </p>
          </div>
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="
            ml-auto
            hidden
            items-center
            gap-4
            lg:flex
            xl:gap-5
          "
        >
          {links.map((link) => {
            const isExternal = link.href.startsWith("http");

            return (
              <a
                key={link.href}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={
                  isExternal
                    ? "noopener noreferrer"
                    : undefined
                }
                className="
                  pc-navlink
                  whitespace-nowrap
                  rounded-lg
                  px-2.5
                  py-1.5
                  text-sm
                  font-medium
                  text-slate-700
                  no-underline
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:text-[#087f8c]
                  dark:text-slate-200
                  dark:hover:text-[#2dd4bf]
                "
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* THEME TOGGLE */}
        <ThemeToggle />

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={menuOpen}
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-700
            shadow-sm
            transition-all duration-200
            hover:border-[#087f8c]
            hover:bg-slate-50
            hover:text-[#087f8c]
            focus:outline-none
            focus:ring-2
            focus:ring-[#087f8c]/30
            dark:border-slate-600
            dark:bg-slate-800
            dark:text-slate-100
            dark:hover:border-[#2dd4bf]
            dark:hover:bg-slate-700
            dark:hover:text-[#2dd4bf]
            lg:hidden
          "
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
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
              className="h-5 w-5"
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

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div
          className="
            border-t
            border-slate-200
            bg-white
            px-4 pb-5 pt-2
            shadow-lg
            dark:border-slate-800
            dark:bg-[#0a0f1a]
            lg:hidden
          "
        >
          <nav className="mx-auto flex max-w-7xl flex-col">
            {links.map((link) => {
              const isExternal =
                link.href.startsWith("http");

              return (
                <a
                  key={link.href}
                  href={link.href}
                  target={
                    isExternal ? "_blank" : undefined
                  }
                  rel={
                    isExternal
                      ? "noopener noreferrer"
                      : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                  className="
                    border-b
                    border-slate-100
                    px-2 py-3.5
                    text-sm
                    font-medium
                    text-slate-700
                    no-underline
                    transition-colors duration-200
                    hover:bg-slate-50
                    hover:text-[#087f8c]
                    dark:border-slate-800
                    dark:text-slate-200
                    dark:hover:bg-slate-900
                    dark:hover:text-[#2dd4bf]
                  "
                >
                  {link.name}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}