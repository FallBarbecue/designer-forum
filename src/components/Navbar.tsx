"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  // Kullanıcının giriş yapıp yapmadığını bu kancayla (hook) anlıyoruz
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo / Anasayfa Linki */}
        <Link href="/" className="text-xl font-bold tracking-wider">
          FikirTasarım
        </Link>

        {/* Menü Linkleri */}
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-gray-300">Forum</Link>
          <Link href="/shop" className="hover:text-gray-300">Market</Link>

          {/* Yükleniyor durumu */}
          {status === "loading" && <span className="text-sm text-gray-400">Yükleniyor...</span>}

          {/* Giriş YAPMAMIŞ Kullanıcılar İçin */}
          {status === "unauthenticated" && (
            <>
              <Link href="/login" className="hover:text-gray-300">Giriş Yap</Link>
              <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                Kayıt Ol
              </Link>
            </>
          )}

          {/* Giriş YAPMIŞ Kullanıcılar İçin */}
          {status === "authenticated" && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Merhaba, {session.user?.name}
              </span>
              <Link href="/dashboard/shop" className="text-sm bg-green-600 px-3 py-1.5 rounded hover:bg-green-700">
                Dükkanım
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm bg-red-600 px-3 py-1.5 rounded hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}