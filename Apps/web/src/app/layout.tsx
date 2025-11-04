import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Klinik THT Aion - Sistem Manajemen Klinik",
  description: "Sistem manajemen klinik THT yang modern dan profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
