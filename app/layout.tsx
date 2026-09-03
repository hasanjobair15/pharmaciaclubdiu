import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
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

          {/* NAVBAR */}
          <Navbar />

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