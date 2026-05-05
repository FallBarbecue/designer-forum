import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { iyzipay } from '@/lib/iyzipay';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });

    const requestData = {
      locale: 'tr',
      conversationId: `TRX-${Date.now()}`,
      price: product.price.toString(),
      paidPrice: product.price.toString(),
      currency: 'TRY',
      basketId: `BSK-${product.id}`,
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/checkout/callback`,
      enabledInstallments: [2, 3, 6, 9],
      buyer: {
        id: (session.user as any).id,
        name: session.user.name?.split(' ')[0] || "Alıcı",
        surname: session.user.name?.split(' ')[1] || "Soyadı",
        gsmNumber: "+905320000000",
        email: session.user.email || "test@test.com",
        identityNumber: "11111111111",
        lastLoginDate: "2026-04-28 12:43:35",
        registrationDate: "2026-01-01 15:12:09",
        registrationAddress: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        ip: "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: session.user.name || "Alıcı",
        city: "Istanbul",
        country: "Turkey",
        address: "Örnek Mah. Test Sok. No:1",
      },
      billingAddress: {
        contactName: session.user.name || "Alıcı",
        city: "Istanbul",
        country: "Turkey",
        address: "Örnek Mah. Test Sok. No:1",
      },
      basketItems: [
        {
          id: product.id,
          name: product.title,
          category1: "Design",
          itemType: "VIRTUAL",
          price: product.price.toString(),
        }
      ]
    };

    const result: any = await new Promise((resolve) => {
      iyzipay.checkoutFormInitialize.create(requestData, (err: any, res: any) => {
        if (err) resolve({ status: 'failure', errorMessage: err.message });
        else resolve(res);
      });
    });

    if (result.status === "success") {
      return NextResponse.json({ paymentUrl: result.paymentPageUrl });
    } else {
      console.error("Iyzico Detaylı Hata:", result);
      return NextResponse.json({ error: result.errorMessage }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 });
  }
}