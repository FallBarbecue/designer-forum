import { NextResponse } from 'next/server';
import { iyzipay } from '@/lib/iyzipay';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment-error`);

    const result: any = await new Promise((resolve) => {
      iyzipay.checkoutForm.retrieve({
        locale: "tr", 
        conversationId: `TRX-${Date.now()}`,
        token: token
      }, (err: any, res: any) => {
        if (err) resolve({ paymentStatus: 'FAILURE', errorMessage: err.message });
        else resolve(res);
      });
    });

    if (result.paymentStatus === "SUCCESS") {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment-success`);
    } else {
      const errorMsg = encodeURIComponent(result.errorMessage || "Ödeme onaylanmadı.");
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment-error?reason=${errorMsg}`);
    }
  } catch (error) {
    console.error("Callback Hatası:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment-error`);
  }
}