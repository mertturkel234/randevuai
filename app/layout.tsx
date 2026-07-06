import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RandevuAI — WhatsApp AI Resepsiyonist",
  description:
    "KOBİ'ler için WhatsApp üzerinden çalışan Türkçe AI randevu asistanı. Otomatik yanıt, randevu alma ve Google Takvim entegrasyonu.",
  openGraph: {
    title: "RandevuAI — WhatsApp AI Resepsiyonist",
    description:
      "WhatsApp'tan gelen her mesaja AI resepsiyonistiniz cevap versin.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased text-slate-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
