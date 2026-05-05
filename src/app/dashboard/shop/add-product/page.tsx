"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0); // Kapak fotoğrafının sırasını tutar
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "1",
  });

  // Çoklu dosya seçildiğinde çalışacak fonksiyon
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let files = Array.from(e.target.files);
      
      if (files.length > 10) {
        alert("Maksimum 10 fotoğraf yükleyebilirsiniz. İlk 10 fotoğraf seçildi.");
        files = files.slice(0, 10);
      }

      setImageFiles(files);
      
      // Ekranda göstermek için geçici URL'ler oluşturuyoruz
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setCoverIndex(0); // Varsayılan olarak ilk seçileni kapak yap
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let imageUrls: string[] = [];

      // 1. Resimleri paralel olarak (hızlıca) Supabase'e yüklüyoruz
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('marketplace').upload(filePath, file);
          if (uploadError) throw new Error("Fotoğraf yüklenirken hata oluştu.");

          const { data } = supabase.storage.from('marketplace').getPublicUrl(filePath);
          return data.publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        
        // 2. Seçilen kapak fotoğrafını dizinin en başına (0. index) alıyoruz
        if (coverIndex !== 0) {
          const coverUrl = uploadedUrls.splice(coverIndex, 1)[0];
          uploadedUrls.unshift(coverUrl);
        } else {
          imageUrls = uploadedUrls;
        }
        imageUrls = uploadedUrls;
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ürün eklenirken bir hata oluştu.");

      alert("Ürün başarıyla eklendi!");
      router.push("/dashboard/shop");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Yeni Ürün Ekle</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Çoklu Resim Yükleme Alanı */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ürün Fotoğrafları (Maksimum 10 Adet)
          </label>
          <input
            type="file"
            multiple // ÇOKLU SEÇİME İZİN VERDİK
            accept="image/*"
            className="w-full px-4 py-2 border rounded-md bg-white mb-4"
            onChange={handleFileChange}
          />
          
          {/* Seçilen Resimlerin Önizlemesi ve Kapak Seçimi */}
          {previewUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Kapak fotoğrafı yapmak istediğiniz resme tıklayın:</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previewUrls.map((url, index) => (
                  <div 
                    key={index} 
                    onClick={() => setCoverIndex(index)}
                    className={`relative cursor-pointer flex-shrink-0 w-24 h-24 rounded-lg border-2 overflow-hidden transition-all ${coverIndex === index ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={url} alt={`Önizleme ${index}`} className="w-full h-full object-cover" />
                    {coverIndex === index && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[10px] font-bold text-center py-1">
                        KAPAK
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Başlığı</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border rounded-md"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Açıklaması</label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-2 border rounded-md"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full px-4 py-2 border rounded-md"
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2 border rounded-md"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || imageFiles.length === 0}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Yükleniyor..." : "Ürünü Satışa Çıkar"}
        </button>
      </form>
    </div>
  );
}