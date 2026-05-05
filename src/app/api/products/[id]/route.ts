import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Düzenleme formuna mevcut ürün bilgilerini doldurmak için kullanılır
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const product = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Ürün getirilirken hata oluştu." }, { status: 500 });
  }
}

// PUT: Ürün bilgilerini (ve varsa yeni resmi) güncellemek için kullanılır
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const body = await request.json();
    const { title, description, price, stock, images } = body;

    // Güvenlik Kontrolü: Bu ürünü düzenlemek isteyen kişi, dükkanın gerçek sahibi mi?
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true }
    });

    if (!product || product.shop.ownerId !== userId) {
      return NextResponse.json({ error: "Bu ürünü düzenleme yetkiniz yok." }, { status: 403 });
    }

    // Veritabanını Güncelle
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        // Sadece yeni bir resim yüklendiyse "images" dizisini ez, yüklenmediyse eski resmi koru
        ...(images && images.length > 0 && { images }),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme sırasında hata oluştu." }, { status: 500 });
  }
}