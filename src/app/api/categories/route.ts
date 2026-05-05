import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. Dükkanları Getir (GET İstediği)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Eğer URL'de userId belirtilmişse, sadece o kullanıcının dükkanını getir
    if (userId) {
      const shop = await prisma.shop.findUnique({
        where: { ownerId: userId },
        include: { products: true } // Dükkanın ürünlerini de beraberinde getir
      });
      return NextResponse.json(shop);
    }

    // userId yoksa, pazaryeri vitrini için TÜM dükkanları getir
    const allShops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { name: true, email: true } } }
    });
    
    return NextResponse.json(allShops);
  } catch (error) {
    return NextResponse.json({ error: "Dükkanlar yüklenirken bir hata oluştu." }, { status: 500 });
  }
}

// 2. Yeni Dükkan Aç (POST İstediği)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, logoUrl, ownerId } = body;

    // Temel doğrulama
    if (!name || !ownerId) {
      return NextResponse.json({ error: "Dükkan adı ve sahibi zorunludur." }, { status: 400 });
    }

    // Kullanıcının zaten bir dükkanı var mı kontrolü (Herkese 1 dükkan hakkı)
    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: ownerId }
    });

    if (existingShop) {
      return NextResponse.json({ error: "Zaten bir dükkanınız bulunuyor." }, { status: 400 });
    }

    // Dükkanı oluştur
    const newShop = await prisma.shop.create({
      data: {
        name,
        description,
        logoUrl,
        ownerId,
      },
    });

    return NextResponse.json(newShop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Dükkan oluşturulamadı. Bu isim zaten kullanılıyor olabilir." }, { status: 500 });
  }
}