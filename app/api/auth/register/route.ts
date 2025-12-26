import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    
    let email, password, name
    try {
      const body = await request.json()
      email = body.email?.trim().toLowerCase()
      password = body.password?.trim()
      name = body.name?.trim()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        { error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      )
    }

    console.log("Registration attempt for:", email)

    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json(
        { error: "이메일과 비밀번호는 필수입니다." },
        { status: 400 }
      )
    }

    if (!name) {
      console.log("Missing name")
      return NextResponse.json(
        { error: "이름은 필수입니다." },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("User already exists:", email)
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)

    // 사용자 생성
    console.log("Creating user...")
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    console.log("User created:", user.id)

    // 기본 무료 구독 생성
    console.log("Creating subscription...")
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'INACTIVE',
        plan: 'FREE',
      },
    })

    console.log("Registration successful:", user.id)

    return NextResponse.json(
      { message: "회원가입이 완료되었습니다.", userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    
    // Prisma 관련 에러 처리
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      )
    }
    
    // 데이터베이스 연결 에러는 상세 메시지 숨김
    if (error.message?.includes('database server') || error.message?.includes('connect')) {
      console.error("Database connection error:", error.message)
      return NextResponse.json(
        { error: "일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      )
    }
    
    // 모든 에러를 콘솔에 로깅 (Vercel Logs 확인용)
    console.error("Full error object:", error)
    
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
