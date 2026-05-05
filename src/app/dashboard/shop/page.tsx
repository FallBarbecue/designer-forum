"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopDashboardPage() {
  const { data: session } = useSession();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      fetch(`/api/shop?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setShop(data);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  // Dükkan yoksa açma sayfasına yönlendirme tasarımı
  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Henüz bir dükkanınız yok!</h2>
        <p className="mb-6 text-gray-600">Hemen dükkanınızı açıp ürünlerinizi satmaya başlayabilirsiniz.</p>
        <Link 
          href="/dashboard/shop/create" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
        >
          Dükkanımı Şimdi Aç
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{shop.name} - Yönetim Paneli</h1>
          <p className="text-gray-500">Dükkanınızdaki ürünleri buradan yönetebilirsiniz.</p>
        </div>
        <Link 
          href="/dashboard/shop/add-product" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700"
        >
          + Yeni Ürün Ekle
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Ürünleriniz</h2>
        {shop.products?.length === 0 ? (
          <p className="text-gray-500 italic">Henüz hiç ürün eklememişsiniz.</p>
        ) : (
          <ul className="divide-y">
            {shop.products?.map((product: any) => (
              <li key={product.id} className="py-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Resim Alanı */}
                  {product.images && product.images[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title} 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-[10px] text-gray-400">Resim Yok</div>
                  )}
                  
                  {/* Ürün Bilgileri */}
                  <div>
                    <p className="font-bold text-lg">{product.title}</p>
                    <p className="text-sm text-gray-500">{product.price} TL — Stok: {product.stock}</p>
                  </div>
                </div>
                
                {/* Aksiyon Butonları */}
                <div className="flex gap-3">
                  <Link 
                    href={`/dashboard/shop/edit-product/${product.id}`}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md border border-blue-200 text-sm transition-colors"
                  >
                    Düzenle
                  </Link>
                  <button className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-md border border-red-200 text-sm transition-colors">
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}