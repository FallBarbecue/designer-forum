import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/core/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DesignerForum | Yaratıcı Topluluk",
  description: "Tasarımcılar için vitrin, geri bildirim ve tartışma platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}