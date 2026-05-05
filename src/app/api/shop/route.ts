import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Artık buradan çekiyoruz

/**
 * GET: Dükkanları listelemek için kullanılır.
 * - Sorgu parametresi olarak 'userId' verilirse, o kullanıcının özel dükkanını getirir.
 * - Parametre yoksa, tüm pazaryeri dükkanlarını listeler.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Belirli bir kullanıcının dükkanını ve ürünlerini getir
    if (userId) {
      const shop = await prisma.shop.findUnique({
        where: { ownerId: userId },
        include: { 
          products: {
            orderBy: { createdAt: 'desc' }
          } 
        }
      });
      return NextResponse.json(shop);
    }

    // Vitrin için tüm dükkanları ve sahiplerini getir
    const allShops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        owner: { 
          select: { name: true, image: true } 
        } 
      }
    });
    
    return NextResponse.json(allShops);
  } catch (error) {
    console.error("Dükkan listeleme hatası:", error);
    return NextResponse.json({ error: "Dükkan verileri çekilirken bir hata oluştu." }, { status: 500 });
  }
}

/**
 * POST: Yeni bir dükkan oluşturmak için kullanılır.
 * - Güvenlik: Sadece giriş yapmış kullanıcılar dükkan açabilir.
 * - Kural: Her kullanıcının sadece bir dükkanı olabilir.
 */
export async function POST(request: Request) {
  try {
    // 1. Sunucu taraflı oturum kontrolü (En güvenli yöntem)
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Bu işlem için giriş yapmalısınız." }, { status: 401 });
    }

    // Kullanıcı ID'sini oturum verisinden alıyoruz (Ön yüze güvenmiyoruz)
    const ownerId = (session.user as any).id;

    const body = await request.json();
    const { name, description, logoUrl } = body;

    // 2. Temel doğrulama
    if (!name) {
      return NextResponse.json({ error: "Dükkan adı zorunludur." }, { status: 400 });
    }

    // 3. Kullanıcının zaten dükkanı var mı kontrolü
    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: ownerId }
    });

    if (existingShop) {
      return NextResponse.json({ error: "Zaten bir dükkanınız bulunuyor. İkinci bir dükkan açamazsınız." }, { status: 400 });
    }

    // 4. Veritabanına kayıt işlemi
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
    console.error("Dükkan oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Dükkan oluşturulamadı. Bu isim daha önce alınmış olabilir." }, 
      { status: 500 }
    );
  }
}