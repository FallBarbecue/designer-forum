import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 1. Gerekli alanların kontrolü
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Lütfen tüm alanları doldurun." }, { status: 400 });
    }

    // 2. Bu e-posta zaten kayıtlı mı?
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kullanılıyor." }, { status: 400 });
    }

    // 3. Şifreyi Kriptola (Hash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Kullanıcıyı Veritabanına Kaydet
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Şifreyi geri döndürmemek için siliyoruz
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Kayıt olurken bir sunucu hatası oluştu." }, { status: 500 });
  }
}