import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "Designer Forum",
  description: "Tasarımcılar için paylaşım platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-black text-white min-h-screen flex flex-col">
        {/* Navbar'ı buraya koyuyoruz */}
        <Navbar />
        
        {/* Sayfa içerikleri burada render edilecek */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}