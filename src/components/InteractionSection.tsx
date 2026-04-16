"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Heart, Send, MessageCircle } from "lucide-react";

export default function InteractionSection({ postId, initialLikes }: { postId: string, initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Yorumları çek
  useEffect(() => {
    async function fetchComments() {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
    }
    fetchComments();
  }, [postId]);

  // Beğeni Fonksiyonu
  const handleLike = async () => {
    const { error } = await supabase.rpc('increment_likes', { post_id: postId });
    // Not: RPC kullanmak için Supabase'de bir fonksiyon tanımlamak gerekir. 
    // Şimdilik doğrudan güncelleme yapalım:
    const { data } = await supabase
      .from("posts")
      .update({ likes_count: likes + 1 })
      .eq("id", postId);
    
    setLikes(likes + 1);
  };

  // Yorum Gönderme
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id: postId, content: comment }])
      .select();

    if (data) {
      setComments([data[0], ...comments]);
      setComment("");
    }
    setLoading(false);
  };

  return (
    <div className="mt-10 border-t border-gray-800 pt-8">
      <div className="flex gap-4 mb-10">
        <button onClick={handleLike} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition group">
          <Heart className={`w-5 h-5 ${likes > initialLikes ? 'fill-red-500 text-red-500' : ''}`} /> 
          <span>{likes} Beğeni</span>
        </button>
      </div>

      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" /> Yorumlar ({comments.length})
      </h3>

      <form onSubmit={handleComment} className="mb-8">
        <div className="relative">
          <input 
            type="text" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Bu tasarım hakkında ne düşünüyorsun?"
            className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none pr-12"
          />
          <button type="submit" disabled={loading} className="absolute right-3 top-3 text-purple-500 hover:text-purple-400 disabled:opacity-50">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
            <p className="text-gray-300">{c.content}</p>
            <span className="text-xs text-gray-500 mt-2 block">
              {new Date(c.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}