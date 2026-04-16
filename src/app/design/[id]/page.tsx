import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import InteractionSection from "@/components/InteractionSection"; // Yeni bileşeni import ettik

export const dynamic = "force-dynamic";

async function getPost(id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function DesignDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("tr-TR", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="max-w-6xl mx-auto mt-4 p-4 lg:p-0">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Geri Dön</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sol Taraf: Büyük Görsel */}
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center p-4 h-max">
          <Image
            src={post.image_url}
            alt={post.title}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            priority
          />
        </div>

        {/* Sağ Taraf: Detaylar ve Etkileşim */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-800">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full"></div>
            <div>
              <p className="text-white font-medium">Anonim Tasarımcı</p>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
          
          <div className="inline-block bg-gray-800 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider w-max mb-6">
            {post.category}
          </div>

          <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-line">
            {post.description || "Bu tasarım için herhangi bir açıklama eklenmemiş."}
          </p>

          {/* DEĞİŞİKLİK BURADA: Eski butonları sildik, yerine etkileşim bileşenini koyduk */}
          <InteractionSection 
            postId={post.id} 
            initialLikes={post.likes_count || 0} 
          />
        </div>
      </div>
    </div>
  );
}