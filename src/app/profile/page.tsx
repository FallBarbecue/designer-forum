"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getProfileData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false }); // En yeniler en üstte
        
      if (posts) setUserPosts(posts);
      setLoading(false);
    }
    getProfileData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-4">
      {/* Profil Başlığı */}
      <div className="flex items-center gap-6 mb-12 p-8 bg-gray-900/30 rounded-3xl border border-gray-800/50">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{user.email.split('@')[0]}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Portfolyom</h2>
      
      {/* Tasarım Grid'i (Tıklanabilir Link Eklendi) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {userPosts.map((post) => (
          <Link 
            href={`/design/${post.id}`} 
            key={post.id} 
            className="group block rounded-xl overflow-hidden border border-gray-800 bg-gray-900 hover:border-purple-500 transition duration-300"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <Image 
                src={post.image_url} 
                alt={post.title} 
                fill
                className="object-cover group-hover:scale-105 transition duration-500" 
              />
            </div>
            <div className="p-4">
              <h3 className="text-white font-bold line-clamp-1">{post.title}</h3>
              <span className="text-xs text-gray-500 uppercase tracking-wider mt-2 block">{post.category}</span>
            </div>
          </Link>
        ))}
        
        {/* Boş Durum (Eğer hiç tasarım yoksa) */}
        {userPosts.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
            <p className="text-gray-500 mb-4">Henüz hiç tasarım yüklemedin.</p>
            <Link href="/upload" className="text-purple-400 font-bold hover:text-purple-300 transition">
              İlk tasarımını yükle →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}