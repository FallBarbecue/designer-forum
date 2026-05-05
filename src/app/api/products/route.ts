import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Artık buradan çekiyoruz

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug: Oturumun gelip gelmediğini terminalde gör
    console.log("API Session Control:", session);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { title, description, price, stock, images } = body;

    const userShop = await prisma.shop.findUnique({
      where: { ownerId: userId }
    });

    if (!userShop) {
      return NextResponse.json({ error: "Önce dükkan açmalısınız." }, { status: 403 });
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 1,
        images: images || [],
        shopId: userShop.id,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    return NextResponse.json({ error: "Ürün eklenirken sunucu hatası oluştu." }, { status: 500 });
  }
}