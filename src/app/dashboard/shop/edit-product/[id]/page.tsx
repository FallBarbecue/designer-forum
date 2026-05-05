"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  // Galeri Yönetimi İçin State'ler
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setFormData({
            title: data.title,
            description: data.description,
            price: data.price.toString(),
            stock: data.stock.toString(),
          });
          if (data.images && data.images.length > 0) {
            setExistingImages(data.images);
          }
        }
        setFetching(false);
      });
  }, [productId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let files = Array.from(e.target.files);
      if (files.length > 10) {
        alert("Maksimum 10 fotoğraf yükleyebilirsiniz.");
        files = files.slice(0, 10);
      }
      setNewImageFiles(files);
      setPreviewUrls(files.map(file => URL.createObjectURL(file)));
      setCoverIndex(0);
    } else {
      setNewImageFiles([]);
      setPreviewUrls([]);
      setCoverIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrls: string[] = [];

      // SENARYO 1: Kullanıcı yepyeni resimler seçti
      if (newImageFiles.length > 0) {
        const uploadPromises = newImageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `products/${fileName}`;
          await supabase.storage.from('marketplace').upload(filePath, file);
          const { data } = supabase.storage.from('marketplace').getPublicUrl(filePath);
          return data.publicUrl;
        });

        finalImageUrls = await Promise.all(uploadPromises);
        
        if (coverIndex !== 0) {
          const coverUrl = finalImageUrls.splice(coverIndex, 1)[0];
          finalImageUrls.unshift(coverUrl);
        }
      } 
      // SENARYO 2: Yeni resim seçmedi, sadece mevcutlar arasından kapağı değiştirdi
      else if (existingImages.length > 0) {
        finalImageUrls = [...existingImages];
        if (coverIndex !== 0) {
          const coverUrl = finalImageUrls.splice(coverIndex, 1)[0];
          finalImageUrls.unshift(coverUrl);
        }
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        }),
      });

      if (!response.ok) throw new Error("Güncellenirken hata oluştu.");

      alert("Ürün başarıyla güncellendi!");
      router.push("/dashboard/shop");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">Yükleniyor...</div>;

  // Hangi resimlerin gösterileceğini belirliyoruz (Yeni seçilenler mi, eskiler mi?)
  const displayImages = newImageFiles.length > 0 ? previewUrls : existingImages;

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border">
      <h1 className="text-3xl font-bold mb-6">Ürünü Düzenle</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Galeri Düzenleme Alanı */}
        <div className="bg-gray-50 p-5 rounded-lg border">
          <label className="block text-sm font-bold text-gray-700 mb-2">Mevcut Galeri & Kapak Seçimi</label>
          <p className="text-xs text-gray-500 mb-4">Kapak yapmak istediğiniz resme tıklayın. Yeni fotoğraf seçerseniz mevcut galeri silinir.</p>
          
          {displayImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
              {displayImages.map((url, index) => (
                <div 
                  key={index} 
                  onClick={() => setCoverIndex(index)}
                  className={`relative cursor-pointer flex-shrink-0 w-24 h-24 rounded-lg border-2 overflow-hidden transition-all ${coverIndex === index ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300 opacity-70 hover:opacity-100'}`}
                >
                  <img src={url} alt={`Resim ${index}`} className="w-full h-full object-cover" />
                  {coverIndex === index && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] font-bold text-center py-1">KAPAK</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full px-4 py-2 border rounded-md bg-white text-sm"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Başlığı</label>
          <input type="text" required className="w-full px-4 py-2 border rounded-md" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Açıklaması</label>
          <textarea required rows={4} className="w-full px-4 py-2 border rounded-md" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL)</label>
            <input type="number" step="0.01" required className="w-full px-4 py-2 border rounded-md" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
            <input type="number" required min="0" className="w-full px-4 py-2 border rounded-md" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700">
          {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </form>
    </div>
  );
}