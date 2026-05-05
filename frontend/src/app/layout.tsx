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
      <body className="min-h-full bg-zinc-50 flex flex-col">
        {USE_MOCKS && (
          <div className="fixed top-0 right-0 z-50 text-[10px] font-bold bg-blue-900 text-white px-2 py-1 shadow-sm border-b border-l border-blue-800 rounded-bl-md">
            MOCK MODE
          </div>
        )}
        {children}
      </body>
    </html>
  );
}