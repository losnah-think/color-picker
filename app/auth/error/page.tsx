"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export const dynamic = "force-dynamic"

const errorMessages: Record<string, string> = {
  OAuthSignin: "OAuth 제공자에 연결할 수 없습니다. Google OAuth 설정을 확인해주세요.",
  OAuthCallback: "OAuth 콜백 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
  OAuthCreateAccount: "계정 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
  OAuthAccountNotLinked: "이미 다른 방식으로 가입한 이메일입니다.",
  EmailCreateAccount: "이메일 계정 생성 중 오류가 발생했습니다.",
  Callback: "콜백 처리 중 오류가 발생했습니다.",
  OAuthSigninError: "Google 로그인 중 오류가 발생했습니다.",
  EmailSigninError: "이메일 로그인 중 오류가 발생했습니다.",
  CredentialsSignin: "자격증명 로그인에 실패했습니다.",
}

export default function ErrorPage() {
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 클라이언트 사이드에서만 query string 읽기
    const searchParams = new URLSearchParams(window.location.search)
    const errorParam = searchParams.get("error")
    setError(errorParam)
  }, [])

  const getErrorMessage = (error: string | null) => {
    if (!error) return "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
    return errorMessages[error] || "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">로그인 오류</h1>
          
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              {getErrorMessage(error)}
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-2 font-mono">
                Error: {error}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              문제가 계속되면 아래를 확인해주세요:
            </p>
            <ul className="text-xs text-gray-500 text-left space-y-1">
              <li>• Google OAuth 설정이 올바른지 확인</li>
              <li>• 리다이렉트 URI가 등록되었는지 확인</li>
              <li>• 브라우저 쿠키 설정 확인</li>
            </ul>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href="/auth/signin"
              className="block w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              로그인 페이지로
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
