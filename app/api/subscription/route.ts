import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserSubscription } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const subscription = await getUserSubscription(session.user.id)
    
    if (!subscription) {
      return NextResponse.json({
        status: "ACTIVE",  // FREE 플랜은 기본값이 ACTIVE
        plan: "FREE",
      })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json(
      { error: "구독 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
