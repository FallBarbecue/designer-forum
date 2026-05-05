import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutButton from "./CheckoutButton";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: { shop: true }
  });

  if (!product) return notFound();

  // TypeScript için veriyi güvenli bir diziye çeviriyoruz
  const images = (product.images as string[]) || [];

  return (
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Sol: Galeri Alanı */}
      <div className="flex flex-col gap-4">
        {/* Ana Resim (Kapak Fotoğrafı her zaman images[0]'dır) */}
        <div className="rounded-2xl overflow-hidden border bg-white aspect-square flex items-center justify-center">
          {images.length > 0 ? (
            <img src={images[0]} className="w-full h-full object-cover" alt={product.title} />
          ) : (
            <span className="text-gray-400">Resim Yok</span>
          )}
        </div>

        {/* Diğer Fotoğraflar Izgarası (Eğer 1'den fazla resim varsa göster) */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(1).map((imgUrl, index) => (
              <div key={index} className="rounded-xl overflow-hidden border bg-white aspect-square">
                <img src={imgUrl} className="w-full h-full object-cover" alt={`${product.title} detay ${index}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sağ: Ürün Detayları */}
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.title}</h1>
        <p className="text-blue-600 font-medium mb-6">Satıcı: {product.shop.name}</p>
        
        <div className="text-3xl font-bold text-gray-800 mb-8">{product.price} TL</div>
        
        <div className="prose prose-blue mb-8 text-gray-600">
          <h3 className="text-lg font-semibold text-gray-800">Ürün Açıklaması</h3>
          <p>{product.description}</p>
        </div>

        <div className="mt-auto space-y-4">
          <p className="text-sm text-gray-500">Stok Durumu: {product.stock > 0 ? `${product.stock} adet` : 'Tükendi'}</p>
          <CheckoutButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}