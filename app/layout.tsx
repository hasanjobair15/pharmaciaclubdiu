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
  icons: {
    icon: "/pharmacialogo.png",
    shortcut: "/pharmacialogo.png",
    apple: "/pharmacialogo.png",
  },
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
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-white text-[#0b1736] antialiased dark:bg-[#0a0f1a] dark:text-slate-100">
        <ThemeProvider>
          <Navbar />

          <main className="min-h-screen bg-white dark:bg-[#0a0f1a]">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-[#0a0f1a]">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
              <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
                {/* CLUB INFO */}
                <div>
                  <p className="font-bold text-[#0b1736] dark:text-white">
                    PHARMACIA CLUB DIU
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Department of Pharmacy · Daffodil International
                    University
                  </p>
                </div>

                {/* COPYRIGHT */}
                <div className="text-center md:text-right">
                  <p className="text-sm font-semibold text-[#0b1736] dark:text-slate-200">
                    © 2026 Pharmacia Club DIU. All Rights Reserved.
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Website Designed & Developed by{" "}
                    <span className="font-semibold text-[#087f8c] dark:text-[#2dd4bf]">
                      Md. Hasan Jobair
                    </span>{" "}
                    — 30th Batch, Department of Pharmacy
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}