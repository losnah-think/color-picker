"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [palette, setPalette] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<number | null>(null);
  const [similarImages, setSimilarImages] = useState<any>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [usedCount, setUsedCount] = useState(0);
  const paletteRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.id) {
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => setSubscription(data))
        .catch((err) => console.error("Failed to fetch subscription:", err));
      
      // 세션 스토리지에서 이번 달 사용 횟수 불러오기
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(`usage_${session.user.id}_${today}`);
      if (stored) {
        setUsedCount(parseInt(stored, 10));
      }
    }
  }, [session, status, router]);

  const examplePrompts = [
    "북유럽 미니멀 스타일의 거실. 밝고 통풍감 있는 느낌. 자연 소재를 활용한 따뜻함",
    "럭셔리한 침실. 어두운 톤의 우아함과 골드 액센트. 편안하고 프리미엄한 분위기",
    "모던 카페 인테리어. 세련된 검은색과 베이지. 도시적이고 세련된 느낌",
    "한국 전통 한옥 거실. 따뜻한 목재 톤과 한색. 고급스럽고 차분한 분위기",
    "실험적인 아트 스튜디오. 대담한 컬러 조합. 창의적이고 활기찬 에너지",
    "미니멀 침실. 모노톤 팔레트. 차분하고 휴식감 있는 공간",
    "보호헤 스타일 주방. 따뜻한 황토톤과 우드. 소박하고 편한 느낌",
    "현대적 서재. 차가운 톤과 초록 식물. 집중력 있고 신선한 공간"
  ];

  // 구독 플랜별 월 제한 횟수
  const getMonthlyLimit = (plan: string) => {
    switch (plan) {
      case "FREE":
        return 5;
      case "BASIC":
        return 50;
      case "PRO":
        return -1; // 무제한
      case "ENTERPRISE":
        return -1; // 무제한
      default:
        return 5;
    }
  };

  const handleGeneratePalette = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // subscription이 로드되는 동안 대기
    if (subscription === null) {
      alert("구독 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 월 제한 횟수 확인
    const monthlyLimit = getMonthlyLimit(subscription.plan);
    if (monthlyLimit !== -1 && usedCount >= monthlyLimit) {
      alert(`이번 달 사용 횟수(${monthlyLimit}회)를 모두 사용했습니다. 다음 달에 다시 이용해주세요.`);
      return;
    }

    // 구독 상태 확인 (FREE는 INACTIVE 상태여도 사용 가능, 유료는 ACTIVE만 가능)
    const isFreeOrActive = subscription.plan === "FREE" || subscription.status === "ACTIVE";
    if (!isFreeOrActive) {
      if (confirm("구독이 필요한 기능입니다. 요금제 페이지로 이동하시겠습니까?")) {
        router.push("/pricing");
      }
      return;
    }

    if (!subscription || !subscription.plan) {
      alert("구독 정보가 없습니다.");
      return;
    }

    if (!prompt.trim()) {
      alert("프롬프트를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-palette", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert("로그인이 필요합니다.");
          router.push("/auth/signin");
          return;
        }
        if (response.status === 403) {
          alert("유효한 구독이 필요합니다.");
          router.push("/pricing");
          return;
        }
        throw new Error("팔레트 생성에 실패했습니다.");
      }

      const data = await response.json();
      setPalette(data);
      setSelectedPalette(null);
      setSimilarImages(null);
      
      // 사용 횟수 증가
      const today = new Date().toISOString().split('T')[0];
      const newCount = usedCount + 1;
      setUsedCount(newCount);
      localStorage.setItem(`usage_${session.user.id}_${today}`, String(newCount));
    } catch (error) {
      console.error("Error:", error);
      alert("팔레트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPaletteImage = async (paletteIndex: number) => {
    const element = paletteRefs.current[paletteIndex];
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${palette.palettes[paletteIndex].paletteName}-팔레트.png`;
      link.click();
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("팔레트 이미지 생성에 실패했습니다.");
    }
  };

  const searchSimilarImages = async (paletteIndex: number) => {
    const p = palette.palettes[paletteIndex];
    setSelectedPalette(paletteIndex);
    setLoadingImages(true);

    try {
      const response = await fetch("/api/search-similar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paletteName: p.paletteName,
          description: p.description,
          colors: p.colors,
        }),
      });

      if (!response.ok) {
        throw new Error("이미지 검색에 실패했습니다.");
      }

      const data = await response.json();
      setSimilarImages(data);
    } catch (error) {
      console.error("Error:", error);
      alert("유사 이미지 검색 중 오류가 발생했습니다.");
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-16 px-4">
      {/* 헤더 - 로그인/로그아웃 */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Color Palette Generator
            </h1>
            {subscription && subscription.status === "ACTIVE" && (
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  subscription.status === "ACTIVE" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                }`}>
                  {subscription.plan}
                </span>
                {getMonthlyLimit(subscription.plan) > 0 && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded whitespace-nowrap">
                    월 {getMonthlyLimit(subscription.plan)}회 중
                  </span>
                )}
                {getMonthlyLimit(subscription.plan) === -1 && (
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                    무제한
                  </span>
                )}
              </div>
            )}
            {!subscription && session && (
              <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                구독 정보 로딩 중...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">로딩 중...</div>
            ) : session ? (
              <>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {session.user?.email}
                </span>
                <a
                  href="/dashboard"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  마이페이지
                </a>
                <a
                  href="/pricing"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  요금제
                </a>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  로그인
                </a>
                <a
                  href="/auth/signup"
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  회원가입
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {(loading || loadingImages) && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-4">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 dark:border-slate-600 border-t-slate-900 dark:border-t-white"></div>
              </div>
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {loading ? "팔레트를 생성하는 중입니다" : "이미지를 검색하는 중입니다"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {loading ? "AI가 최적의 컬러 팔레트를 분석 중..." : "인테리어 이미지를 찾는 중..."}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* 구독 정보 섹션 */}
        {session && subscription && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">현재 플랜</p>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${
                    subscription.plan === "PRO" ? "text-purple-600 dark:text-purple-400" :
                    subscription.plan === "ENTERPRISE" ? "text-red-600 dark:text-red-400" :
                    subscription.plan === "BASIC" ? "text-blue-600 dark:text-blue-400" :
                    "text-slate-600 dark:text-slate-400"
                  }`}>
                    {subscription.plan}
                  </span>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {getMonthlyLimit(subscription.plan) > 0 ? (
                          <>이번 달 사용: <span className="text-purple-600 dark:text-purple-400">{usedCount}</span> / {getMonthlyLimit(subscription.plan)}회</>
                        ) : (
                          <>무제한 사용 가능</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <a href="/pricing" className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium">
                플랜 업그레이드 →
              </a>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 mb-10">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-light mb-3 text-slate-900 dark:text-white tracking-tight">
              인테리어 컬러 팔레트 생성기
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              AI가 제안하는 3가지 팔레트 중에서 당신의 스타일을 찾아보세요
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                인테리어 프롬프트 입력
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 북유럽 미니멀 스타일의 거실. 밝고 통풍감 있는 느낌. 자연 소재를 활용한 따뜻함"
                className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-white font-light"
                rows={4}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                프롬프트 예시:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="text-left px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-light transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGeneratePalette}
              disabled={loading || loadingImages}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              팔레트 생성
            </button>
          </div>
        </div>

        {palette && (
          <div className="space-y-8">
            <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight mb-8">
              추천 팔레트 비교
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {palette.palettes && palette.palettes.map((p: any, index: number) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden animate-fadeIn flex flex-col">
                  <div
                    ref={(el) => {
                      if (el) paletteRefs.current[index] = el;
                    }}
                    className="p-4 bg-slate-100 dark:bg-slate-700/50 flex-1 flex flex-col"
                  >
                    <div className="text-left mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {p.paletteName}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      {p.colors.map((color: any, colorIndex: number) => (
                        <div key={colorIndex} className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {color.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {color.pantoneCode}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(color.hex);
                              alert(`${color.hex} 복사됨`);
                            }}
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded transition-colors flex-shrink-0 font-mono border border-slate-200 dark:border-slate-600"
                          >
                            {color.hex}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 p-3 bg-slate-200 dark:bg-slate-700 border-t border-slate-300 dark:border-slate-600">
                    <button
                      onClick={() => downloadPaletteImage(index)}
                      disabled={loading || loadingImages}
                      className="flex-1 px-3 py-2 text-sm bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => searchSimilarImages(index)}
                      disabled={loading || loadingImages}
                      className="flex-1 px-3 py-2 text-sm bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      유사 이미지
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {similarImages && selectedPalette !== null && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mt-12">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                  {similarImages.paletteName}와 어울리는 이미지
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {similarImages.images && similarImages.images.length > 0 ? (
                    similarImages.images.map((img: any, idx: number) => (
                      <a
                        key={idx}
                        href={img.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-300 dark:bg-slate-700">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end justify-end p-2">
                            <p className="text-white text-xs font-light text-right mb-1">
                              {img.photographer}
                            </p>
                            <span className="text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded">
                              {img.source || "Image"}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-slate-500 dark:text-slate-400">이미지를 찾을 수 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-12 text-sm text-slate-600 dark:text-slate-400 font-light">
          <p>Powered by Google Gemini AI</p>
        </div>
      </div>
    </main>
  );
}
