import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "새 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "비밀번호가 설정되지 않은 계정입니다." },
        { status: 400 }
      )
    }

    // 현재 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "현재 비밀번호가 올바르지 않습니다." },
        { status: 400 }
      )
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // DB 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: "비밀번호가 성공적으로 변경되었습니다.",
      success: true,
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
