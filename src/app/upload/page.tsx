"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ui");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Sayfa açıldığında kullanıcının giriş yapıp yapmadığını kontrol et
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Giriş yapmamışsa login sayfasına yönlendir
        router.push("/login");
      } else {
        setUser(user);
      }
    }
    checkUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Güvenlik kontrolü: Kullanıcı yoksa veya dosya seçilmemişse engelle
    if (!file || !title || !user) {
      setMessage("Lütfen bir görsel ve başlık ekleyin.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. Görseli Supabase Storage'a Yükle
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('design')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from('design')
        .getPublicUrl(fileName);

      // 3. Veritabanına kaydet (Kullanıcı kimliği ile birlikte)
      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          { 
            title, 
            description, 
            category, 
            image_url: publicUrl,
            user_id: user.id // <-- Tasarımı yükleyen kişiye bağlıyoruz
          }
        ]);

      if (dbError) throw dbError;

      setMessage("Tasarım başarıyla yüklendi! 🎉");
      setFile(null);
      setTitle("");
      setDescription("");
      
    } catch (error: any) {
      setMessage("Hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Oturum kontrolü yapılırken boş bir yükleme ekranı göster
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="text-purple-500" />
          Yeni Tasarım Paylaş
        </h1>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
          İptal Et
        </Link>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition cursor-pointer relative">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="text-purple-400 font-medium">{file.name} seçildi</div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p>Görsel seçmek için tıklayın veya sürükleyin</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Tasarım Başlığı</label>
          <input 
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-md p-3 text-white focus:border-purple-500 outline-none"
            placeholder="Logom, UI Tasarımım vb."
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
          <textarea 
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-md p-3 text-white focus:border-purple-500 outline-none h-24 resize-none"
            placeholder="Bu çalışma hakkında biraz bilgi ver..."
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Kategori</label>
          <select 
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-md p-3 text-white focus:border-purple-500 outline-none"
          >
            <option value="ui">UI / UX Tasarım</option>
            <option value="logo">Logo & Branding</option>
            <option value="3d">3D Modelleme</option>
            <option value="illustration">İllüstrasyon</option>
          </select>
        </div>

        {message && <div className="text-sm font-medium text-center text-purple-400">{message}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
          {loading ? "Yükleniyor..." : "Yayına Al"}
        </button>
      </form>
    </div>
  );
}