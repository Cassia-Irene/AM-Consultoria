import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { USE_MOCKS } from "@/config/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AM Consultoria",
  description: "Sistema de gestão de clientes, visitas e faturamento",
};

import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#07090D] flex flex-col">
        {USE_MOCKS && (
          <div className="fixed bottom-4 right-4 z-50 text-[10px] font-black uppercase tracking-widest bg-sky-600 text-white px-3 py-1.5 shadow-xl border border-sky-400/30 rounded-lg">
            Modo Simulação
          </div>
        )}
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}