import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

// Sayfanın her zaman en güncel veriyi çekmesini sağlar
export const dynamic = "force-dynamic";

async function getPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Veri çekme hatası:", error);
    return [];
  }
  return data;
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="mt-8">
      {/* Başlık Alanı */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
          Tasarım Dünyasını Keşfet
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Dünyanın dört bir yanından tasarımcıların projelerini incele, ilham al ve kendi çalışmalarını toplulukla paylaş.
        </p>
      </div>

      {/* Masonry Grid (Pinterest Tarzı) */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
            
            {/* Görsel */}
            <Image
              src={post.image_url}
              alt={post.title}
              width={600}
              height={800}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              priority // LCP uyarısını çözen sihirli kelime
            />

            {/* Hover Durumunda Çıkan Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              
              <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1">
                {post.title}
              </h3>
              
              <div className="flex justify-between items-center mt-2">
                <span className="bg-purple-600/80 text-white text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider">
                  {post.category}
                </span>
                
                <div className="flex gap-3 text-gray-300">
                  <button className="flex items-center gap-1 hover:text-white transition">
                    <Heart className="h-4 w-4" /> <span className="text-xs">0</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-white transition">
                    <MessageCircle className="h-4 w-4" /> <span className="text-xs">0</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Eğer hiç post yoksa */}
      {(!posts || posts.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          <p>Henüz hiç tasarım yüklenmemiş.</p>
          <Link href="/upload" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
            İlk tasarımı sen yükle!
          </Link>
        </div>
      )}
    </div>
  );
}