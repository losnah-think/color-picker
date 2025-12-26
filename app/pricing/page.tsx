"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const plans = [
  {
    name: "FREE",
    price: "₩0",
    priceId: null,
    features: [
      "월 5회 팔레트 생성",
      "기본 컬러 팔레트",
      "이미지 검색 제한",
    ],
  },
  {
    name: "BASIC",
    price: "₩9,900",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    features: [
      "월 50회 팔레트 생성",
      "프리미엄 컬러 팔레트",
      "무제한 이미지 검색",
      "팔레트 저장 기능",
    ],
    popular: true,
  },
  {
    name: "PRO",
    price: "₩29,900",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      "무제한 팔레트 생성",
      "AI 고급 추천",
      "무제한 이미지 검색",
      "팔레트 저장 및 공유",
      "우선 지원",
    ],
  },
  {
    name: "ENTERPRISE",
    price: "₩99,900",
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "무제한 팔레트 생성",
      "팀 협업 기능",
      "API 액세스",
      "커스텀 브랜드 컬러",
      "전담 지원팀",
      "SLA 보장",
    ],
  },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (!priceId) {
      return
    }

    setLoading(planName)

    try {
      console.log("구독 요청 중...", { priceId, planName })
      
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      })

      console.log("응답 상태:", response.status)
      const data = await response.json()
      console.log("응답 데이터:", data)

      if (!response.ok) {
        console.error("API 에러:", data.error)
        alert(data.error || "구독 처리 중 오류가 발생했습니다.")
        return
      }

      if (data.url) {
        console.log("Stripe 체크아웃 URL로 이동:", data.url)
        window.location.href = data.url
      } else {
        console.error("체크아웃 URL이 없음")
        alert("결제 페이지를 열 수 없습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert(`구독 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            요금제 선택
          </h1>
          <p className="text-xl text-gray-600">
            프로젝트에 맞는 플랜을 선택하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg p-8 relative flex flex-col h-full ${
                plan.popular ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-2xl text-sm font-semibold">
                  인기
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600">/월</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={!plan.priceId || loading === plan.name}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : plan.priceId
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {loading === plan.name
                  ? "처리 중..."
                  : plan.priceId
                  ? "구독하기"
                  : "현재 플랜"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-purple-600 hover:underline font-medium"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
