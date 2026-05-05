import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ShopProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const shopId = resolvedParams.id;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: { select: { name: true } },
      products: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!shop) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Dükkan Üst Bilgisi */}
      <div className="bg-white p-8 rounded-xl shadow-sm border mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
        <p className="text-gray-500 mb-4 text-lg">Sahibi: {shop.owner?.name}</p>
        <p className="text-gray-700 max-w-2xl mx-auto">{shop.description}</p>
      </div>

      <h2 className="text-2xl font-bold mb-6">Vitrin ({shop.products.length} Ürün)</h2>
      
      {shop.products.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
          Bu dükkanda henüz satışta olan bir ürün bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shop.products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 bg-white hover:shadow-lg transition-shadow flex flex-col">
              {/* Resim Alanı */}
              <div className="w-full h-48 bg-gray-100 rounded-md mb-4 overflow-hidden border">
                {product.images && (product.images as string[])[0] ? (
                  <img 
                    src={(product.images as string[])[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Resim Yok</div>
                )}
              </div>

              <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t">
                <span className="font-bold text-xl text-blue-600">{product.price} TL</span>
                <Link 
                  href={`/product/${product.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  İncele
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}