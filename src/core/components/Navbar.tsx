import Link from 'next/link';
import { PenTool, Search, Bell, UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        
        {/* Logo Alanı */}
        <Link href="/" className="flex items-center gap-2 text-white hover:text-gray-300 transition">
          <PenTool className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold tracking-tighter">DesignerForum</span>
        </Link>

        {/* Orta Arama Çubuğu (Şimdilik görsel) */}
        <div className="hidden md:flex flex-1 items-center justify-center max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="İlham ara, tasarım bul..." 
              className="w-full rounded-full border border-gray-700 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-gray-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>
        </div>

        {/* Sağ İkonlar ve Profil */}
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-white transition"><Bell className="h-5 w-5" /></button>
          <button className="hover:text-white transition"><UserCircle className="h-6 w-6" /></button>
          <button className="hidden sm:block rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition">
            Paylaş
          </button>
        </div>
        
      </div>
    </nav>
  );
}