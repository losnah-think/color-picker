"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 유효성 검사
    if (!name || !email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.")
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.")
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Registration API error:", response.status, data)
        setError(data.error || `회원가입 중 오류가 발생했습니다. (${response.status})`)
        return
      }

      console.log("Registration successful, attempting auto-login...")

      // 회원가입 성공 후 자동 로그인
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Login error:", result.error)
        setError("회원가입은 완료되었으나 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.")
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
        return
      }

      if (result?.ok) {
        console.log("Login successful, redirecting...")
        // 세션이 저장될 시간 주기
        await new Promise(resolve => setTimeout(resolve, 500))
        router.refresh()
        // 약간의 지연 후 리다이렉트
        await new Promise(resolve => setTimeout(resolve, 300))
        router.push("/")
      } else {
        console.error("Sign in did not return ok")
        setError("로그인 중 오류가 발생했습니다. 로그인 페이지에서 다시 시도해주세요.")
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      console.log("Starting Google sign up...")
      setLoading(true)
      setError("")
      await signIn("google", { callbackUrl: "/" })
      console.log("Google sign up initiated - will redirect after callback")
    } catch (error: any) {
      console.error("Google sign up error:", error)
      setError("Google 회원가입 중 오류가 발생했습니다.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          회원가입
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 autofill:bg-white autofill:text-gray-900 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 autofill:bg-white autofill:text-gray-900 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed autofill:bg-white autofill:text-gray-900 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="••••••••"
            />
            <p className={`text-xs mt-1 ${password.length < 6 ? 'text-red-500' : 'text-green-500'}`}>
              {password.length < 6 ? `${6 - password.length}자 더 필요합니다` : '비밀번호 요구사항 충족'}
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed autofill:bg-white autofill:text-gray-900 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="••••••••"
            />
            {confirmPassword && (
              <p className={`text-xs mt-1 ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                {password === confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword || !name || !email}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 가입
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <a href="/auth/signin" className="text-purple-600 hover:underline font-medium">
            로그인
          </a>
        </p>
      </div>
    </div>
  )
}
