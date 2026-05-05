import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth'u merkezi ayarlarımızla başlatıyoruz
const handler = NextAuth(authOptions);

// Next.js App Router kuralı: GET ve POST isteklerini bu handler'a yönlendir
export { handler as GET, handler as POST };