"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [palette, setPalette] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const handleGeneratePalette = async () => {
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
        throw new Error("팔레트 생성에 실패했습니다.");
      }

      const data = await response.json();
      setPalette(data);
    } catch (error) {
      console.error("Error:", error);
      alert("팔레트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-16 px-4">
      <div className="max-w-5xl mx-auto">
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
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "AI가 팔레트를 생성하는 중..." : "팔레트 생성"}
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
                <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 animate-fadeIn">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg mb-3">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {p.paletteName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {p.colors.map((color: any, colorIndex: number) => (
                      <div key={colorIndex} className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {color.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {color.pantoneCode}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(color.hex);
                              alert(`${color.hex} 복사됨`);
                            }}
                            className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
                          >
                            {color.hex}
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {color.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-sm text-slate-600 dark:text-slate-400 font-light">
          <p>Powered by Google Gemini AI</p>
        </div>
      </div>
    </main>
  );
}
