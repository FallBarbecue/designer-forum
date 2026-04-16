"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="flex justify-between items-center p-6 border-b border-gray-800">
      {/* Sol Kısım: Logo */}
      <div>
        <Link href="/" className="text-xl font-bold">
          DesignerForum
        </Link>
      </div>
      
      {/* Sağ Kısım: Linkler ve Auth Durumu */}
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/" className="hover:underline">Keşfet</Link>
        <Link href="/upload" className="hover:underline">Yükle</Link>
        
        <span className="text-gray-700">|</span> {/* Ayırıcı çizgi */}

        {user ? (
          <>
            <Link href="/profile" className="hover:underline">Profil</Link>
            <button onClick={handleLogout} className="hover:underline text-red-400">
              Çıkış Yap
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:underline font-semibold">
            Giriş Yap
          </Link>
        )}
      </nav>
    </header>
  );
}