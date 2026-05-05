"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MarketplacePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => {
        setShops(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">Dükkanlar yükleniyor...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Tasarımcı Pazaryeri</h1>
      
      {shops.length === 0 ? (
        <p className="text-gray-500">Henüz hiç dükkan açılmamış.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop: any) => (
            <div key={shop.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">{shop.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{shop.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Sahibi: {shop.owner?.name}</span>
                <Link 
                  href={`/shop/${shop.id}`} 
                  className="text-blue-600 font-medium hover:underline"
                >
                  Dükkanı Gez →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}