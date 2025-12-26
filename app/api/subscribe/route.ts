import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { getPrismaClient } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: "가격 ID가 필요합니다." },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // 사용자의 구독 정보 확인
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    let customerId = subscription?.stripeCustomerId

    // Stripe 고객이 없으면 생성
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId,
        },
      })
      customerId = customer.id

      // DB 업데이트
      subscription = await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          status: 'INACTIVE',
          plan: 'FREE',
        },
        update: {
          stripeCustomerId: customerId,
        },
      })
    }

    // Stripe Checkout 세션 생성
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "결제 세션 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
