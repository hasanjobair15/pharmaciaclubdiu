"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = {
  name: string;
  href: string;
  external?: boolean;
};

// Removed the duplicated “Students” link and added a clean mobile‑only separator.
const links: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Committee", href: "/committee" },
  { name: "Events", href: "/events" },
  { name: "Academic", href: "/academic" },
  {
    name: "Routine",
    href: "https://pharmroutine-diu.vercel.app/",
    external: true,
  },
  {
    name: "Faculty",
    href: "https://faculty.daffodilvarsity.edu.bd/teachers/pharmacy.html",
    external: true,
  },
  { name: "Research", href: "/research" },
  { name: "Magazine", href: "/magazine" },
  { name: "Gallery", href: "/gallery" },
  { name: "News", href: "/news" },
  // Students link removed (duplicate)
  { name: "Alumni", href: "/alumni" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const isActive = (href: string, external?: boolean) => {
    if (external) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <nav className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-4 xl:px-6">
        <div className="flex min-h-16 items-center justify-between gap-2">
          <Link href="/" onClick={closeMobileMenu} className="flex shrink-0 items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white sm:h-10 sm:w-10">
              <Image
                src="/pharmacialogo.png"
                alt="Pharmacia Club DIU"
                fill
                priority
                sizes="40px"
                className="object-contain p-0.5"
              />
            </div>
            <div className="hidden md:block">
              <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">
                Pharmacia Club DIU
              </p>
              <p className="whitespace-nowrap text-[11px] text-gray-400">
                Department of Pharmacy
              </p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-0.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {links.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-medium text-gray-300 transition hover:bg-gray-800 hover:text-green-400 lg:text-xs xl:px-2.5"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-medium transition lg:text-xs xl:px-2.5 ${
                      isActive(link.href, link.external)
                        ? "bg-green-950/70 text-green-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-green-400"
                    }`}
                  >
                    {link.name}
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-200 transition hover:bg-gray-800 hover:text-yellow-300 sm:h-10 sm:w-10 sm:rounded-xl"
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path
                      strokeLinecap="round"
                      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-200 transition hover:bg-gray-800 sm:h-10 sm:w-10 sm:rounded-xl lg:hidden"
            >
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-800 py-3 lg:hidden">
            <div className="flex max-h-[75vh] flex-col overflow-y-auto">
              {links.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-green-400"
                  >
                    <span className="flex items-center justify-between">
                      <span>{link.name}</span>
                      <span className="text-xs text-gray-500">↗</span>
                    </span>
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive(link.href, link.external)
                        ? "bg-green-950/70 text-green-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-green-400"
                    }`}
                  >
                    {link.name}
                  </Link>
                ),
              )}

              {mounted && (
                <div className="mt-2 border-t border-gray-800 pt-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-700 px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                  >
                    <span>{darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
                    <span className="text-xs text-gray-500">Switch</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
