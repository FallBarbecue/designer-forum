"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Giriş mi Kayıt mı?
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (isLogin) {
        // GİRİŞ YAP (SIGN IN)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push("/"); // Başarılıysa anasayfaya yönlendir
        router.refresh();
        
      } else {
        // KAYIT OL (SIGN UP)
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage({ 
          text: "Kayıt başarılı! Lütfen giriş yapın.", 
          type: "success" 
        });
        setIsLogin(true); // Kayıt olunca giriş formuna geç
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {isLogin ? "Tekrar Hoş Geldin" : "Aramıza Katıl"}
          </h1>
          <p className="text-gray-400">
            {isLogin ? "Tasarım dünyasını keşfetmeye devam et." : "Kendi portfolyonu oluştur ve toplulukla paylaş."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">E-Posta Adresi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none transition"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          {/* Şifre Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none transition"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {/* Mesaj Alanı (Hata veya Başarı) */}
          {message.text && (
            <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              {message.text}
            </div>
          )}

          {/* Aksiyon Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Mod Değiştirici */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage({ text: "", type: "" }); }}
            className="text-purple-400 hover:text-purple-300 font-semibold transition"
          >
            {isLogin ? "Şimdi Kayıt Ol" : "Giriş Yap"}
          </button>
        </div>
      </div>
    </div>
  );
}