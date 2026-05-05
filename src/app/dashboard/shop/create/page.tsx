"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateShopPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Şimdilik test amaçlı sahte bir kullanıcı ID'si veriyoruz. 
  // (Kimlik doğrulama sistemini bağladığımızda burası otomatik dolacak)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Dükkan oluşturulurken bir hata oluştu.");
      }

      alert("Tebrikler! Dükkanınız başarıyla açıldı.");
      router.push("/dashboard/shop"); // Dükkan yönetim paneline yönlendir
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Kendi Dükkanını Aç</h1>
      <p className="text-gray-600 mb-8">
        Tasarımlarını ve ürünlerini satmaya başlamak için dükkan profilini oluştur.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dükkan Adı
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Örn: Minimalist Tasarımlar"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dükkan Açıklaması
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Müşterilerinize dükkanınızdan ve vizyonunuzdan bahsedin..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Dükkan Kuruluyor..." : "Dükkanı Oluştur"}
        </button>
      </form>
    </div>
  );
}