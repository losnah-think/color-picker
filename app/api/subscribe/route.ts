import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { getPrismaClient } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("구독 요청 시작...")
    const prisma = getPrismaClient()
    const session = await auth()
    
    console.log("세션:", session)
    
    if (!session?.user?.id) {
      console.error("세션이 없거나 사용자 ID가 없음")
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceId } = body
    
    console.log("요청 priceId:", priceId)

    if (!priceId) {
      return NextResponse.json(
        { error: "가격 ID가 필요합니다." },
        { status: 400 }
      )
    }

    const userId = session.user.id
    console.log("사용자 ID:", userId)

    // 사용자의 구독 정보 확인
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    let customerId = subscription?.stripeCustomerId
    console.log("기존 Stripe customerId:", customerId)

    // Stripe 고객이 없으면 생성
    if (!customerId) {
      console.log("새 Stripe 고객 생성 중...")
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId,
        },
      })
      customerId = customer.id
      console.log("새 customerId 생성됨:", customerId)

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

    console.log("체크아웃 세션 생성 중...")
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

    console.log("체크아웃 URL:", checkoutSession.url)
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { error: `결제 세션 생성 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}
