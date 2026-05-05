import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import Navbar from "@/components/Navbar"; // Navbar'ı import ettik (Dizinini kendi projene göre ayarla)

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FikirTasarım | Forum ve Market",
  description: "Tasarım ve Yazılım Ekosistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {/* Navbar'ı her sayfanın en üstünde görünecek şekilde buraya koyuyoruz */}
          <Navbar />
          
          {/* Sayfa içerikleri burada render edilecek */}
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}