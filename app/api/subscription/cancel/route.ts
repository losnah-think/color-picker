import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const prisma = getPrismaClient()

    // 사용자의 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    if (subscription.status === "CANCELED") {
      return NextResponse.json(
        { error: "이미 해지된 구독입니다." },
        { status: 400 }
      )
    }

    // Stripe 구독이 있는 경우만 Stripe에서 취소
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      } catch (error) {
        console.error("Stripe cancellation error:", error)
        // Stripe 오류가 발생해도 DB는 업데이트
      }
    }

    // DB에서 구독 상태를 CANCELED로 변경
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        plan: "FREE",
      },
    })

    return NextResponse.json({
      message: "구독이 해지되었습니다.",
      success: true,
    })
  } catch (error) {
    console.error("Subscription cancellation error:", error)
    return NextResponse.json(
      { error: "구독 해지 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
