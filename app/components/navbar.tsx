"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
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
  { name: "Students", href: "/students" },
  { name: "Alumni", href: "/alumni" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, external?: boolean) {
    if (external) return false;

    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
          {/* Brand / Logo */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex shrink-0 items-center gap-3"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
              <Image
                src="/pharmacialogo.png"
                alt="Pharmacia Club DIU"
                fill
                priority
                sizes="44px"
                className="object-contain p-0.5"
              />
            </div>

            <div className="hidden sm:block">
              <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">
                Pharmacia Club DIU
              </p>

              <p className="whitespace-nowrap text-xs text-gray-400">
                Department of Pharmacy
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 xl:flex">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-green-400"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive(link.href)
                      ? "bg-green-950/70 text-green-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-green-400"
                  }`}
                >
                  {link.name}
                </Link>
              ),
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 text-gray-200 transition hover:bg-gray-800 xl:hidden"
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="border-t border-gray-800 py-3 xl:hidden">
            <div className="flex max-h-[75vh] flex-col overflow-y-auto">
              {links.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
                  >
                    <span className="flex items-center justify-between">
                      {link.name}
                      <span className="text-xs text-gray-500">↗</span>
                    </span>
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive(link.href)
                        ? "bg-green-950/70 text-green-400"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {link.name}
                  </Link>
                ),
              )}

              <div className="mt-2 border-t border-gray-800 pt-3">
                <Link
                  href="/students/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-green-700"
                >
                  Student Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
