import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/theme-toggle";
import { ThemeProvider } from "./components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pharmacia Club DIU",
  description:
    "Pharmacia Club DIU — Department of Pharmacy, Daffodil International University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">
        <ThemeProvider>
          {/* PERMANENT NAVBAR */}
          <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#0a0f1a]/95">
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4 lg:px-8">
              
              {/* LOGO */}
              <a href="/" className="flex shrink-0 items-center gap-3">
                <img
                  src="/pharmacialogo.png"
                  alt="Pharmacia Club DIU"
                  className="h-11 w-11 rounded-xl object-contain"
                />

                <div>
                  <p className="text-sm font-bold tracking-wide text-[#0b1736] dark:text-white">
                    PHARMACIA CLUB
                  </p>

                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    DIU · Department of Pharmacy
                  </p>
                </div>
              </a>

              {/* NAVIGATION */}
              <nav className="ml-auto flex items-center gap-5 overflow-x-auto whitespace-nowrap text-sm font-medium">
                <a href="/" className="transition hover:text-[#087f8c]">
                  Home
                </a>

                <a href="/about" className="transition hover:text-[#087f8c]">
                  About
                </a>

                <a href="/committee" className="transition hover:text-[#087f8c]">
                  Committee
                </a>

                <a href="/events" className="transition hover:text-[#087f8c]">
                  Events
                </a>

                <a href="/academic" className="transition hover:text-[#087f8c]">
                  Academic
                </a>

                <a href="/research" className="transition hover:text-[#087f8c]">
                  Research
                </a>

                <a href="/publications" className="transition hover:text-[#087f8c]">
                  Publications
                </a>

                <a href="/gallery" className="transition hover:text-[#087f8c]">
                  Gallery
                </a>

                <a href="/news" className="transition hover:text-[#087f8c]">
                  News
                </a>

                <a href="/contact" className="transition hover:text-[#087f8c]">
                  Contact
                </a>
              </nav>

              {/* THEME TOGGLE */}
              <ThemeToggle />

              {/* JOIN BUTTON */}
              <a
                href="/contact"
                className="hidden shrink-0 rounded-full bg-[#0b1736] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#087f8c] lg:block"
              >
                Join Us
              </a>
            </div>
          </header>

          {/* PAGE CONTENT */}
          {children}

          {/* FOOTER */}
          <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a0f1a]">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                
                <div>
                  <p className="font-bold text-[#0b1736] dark:text-white">
                    PHARMACIA CLUB DIU
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Department of Pharmacy · Daffodil International University
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  © 2026 Pharmacia Club DIU. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}