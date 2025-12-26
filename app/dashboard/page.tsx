"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // 로그인 확인 및 구독 정보 로드
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscription")
        const data = await res.json()
        setSubscription(data)
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
      }
    }

    fetchSubscription()
  }, [session, status, router])

  // 비밀번호 변경
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error })
      } else {
        setMessage({ type: "success", text: "비밀번호가 변경되었습니다." })
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setShowPasswordModal(false)
      }
    } catch (error) {
      setMessage({ type: "error", text: "오류가 발생했습니다." })
    } finally {
      setLoading(false)
    }
  }

  // 구독 해지
  const handleCancelSubscription = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error })
      } else {
        setMessage({ type: "success", text: "구독이 해지되었습니다." })
        setShowCancelModal(false)
        // 구독 정보 새로고침
        const subscriptionRes = await fetch("/api/subscription")
        const subscriptionData = await subscriptionRes.json()
        setSubscription(subscriptionData)
      }
    } catch (error) {
      setMessage({ type: "error", text: "구독 해지 중 오류가 발생했습니다." })
    } finally {
      setLoading(false)
    }
  }
  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (status === "loading") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">마이페이지</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            로그아웃
          </button>
        </div>

        {/* 메시지 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-400"
                : "bg-red-100 text-red-800 border border-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 사용자 정보 섹션 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            계정 정보
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                이름
              </label>
              <p className="text-lg text-slate-900 dark:text-white">
                {session.user?.name || "설정되지 않음"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                이메일
              </label>
              <p className="text-lg text-slate-900 dark:text-white">
                {session.user?.email}
              </p>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              비밀번호 변경
            </button>
          </div>
        </div>

        {/* 구독 정보 섹션 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            구독 정보
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    현재 플랜
                  </label>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {subscription.plan}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  subscription.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {subscription.status === "ACTIVE" ? "활성" : "취소됨"}
                </div>
              </div>

              {subscription.stripeCurrentPeriodEnd && subscription.status === "ACTIVE" && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    다음 갱신일
                  </label>
                  <p className="text-lg text-slate-900 dark:text-white">
                    {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              )}

              {subscription.status === "ACTIVE" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  구독 해지
                </button>
              )}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">구독 정보를 불러오는 중...</p>
          )}
        </div>

        {/* 비밀번호 변경 모달 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                비밀번호 변경
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "처리 중..." : "변경"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 구독 해지 확인 모달 */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                구독 해지
              </h3>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                정말 구독을 해지하시겠습니까? 현재 구독 기간 동안 서비스를 이용할 수 있으며, 
                다음 갱신일부터 서비스 이용이 제한됩니다.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  취소
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? "처리 중..." : "해지"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 홈으로 돌아가기 */}
        <div className="text-center">
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
