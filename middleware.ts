import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // 보호된 경로 정의 (로그인 필수)
  const protectedPaths = ["/", "/dashboard", "/api/generate-palette", "/api/search-similar", "/pricing"]
  // 공개 접근 경로
  const publicPaths = ["/auth/signin", "/auth/signup", "/auth/error", "/api/auth"]
  const { pathname } = request.nextUrl

  // 공개 경로는 항상 통과
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const isProtectedPath = protectedPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))

  // 보호된 경로인 경우 인증 체크
  if (isProtectedPath) {
    // NextAuth v5 beta의 쿠키 이름들 확인
    const sessionToken = 
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value

    if (!sessionToken) {
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
