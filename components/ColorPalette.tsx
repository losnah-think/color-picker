"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";

interface Color {
  name: string;
  pantoneCode: string;
  hex: string;
  usage: string;
  description: string;
}

interface PaletteProps {
  palette: {
    paletteName: string;
    description: string;
    colors: Color[];
    research?: string;
    researchImages?: Array<{
      url: string;
      title: string;
      source: string;
    }>;
  };
}

export default function ColorPalette({ palette }: PaletteProps) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const researchRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`${text} 복사됨`);
  };

  const downloadPaletteImage = async () => {
    if (!paletteRef.current) return;

    try {
      const canvas = await html2canvas(paletteRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${palette.paletteName}-팔레트.png`;
      link.click();
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("팔레트 이미지 생성에 실패했습니다.");
    }
  };

  const downloadResearchImage = async () => {
    if (!researchRef.current) return;

    try {
      const canvas = await html2canvas(researchRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${palette.paletteName}-리서치.png`;
      link.click();
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("리서치 이미지 생성에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-10">
      {/* 팔레트 섹션 */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 animate-fadeIn">
        <div className="mb-10">
          <h2 className="text-4xl font-light text-slate-900 dark:text-white mb-4 tracking-tight">
            {palette.paletteName}
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-light">
            {palette.description}
          </p>
        </div>

        <div
          ref={paletteRef}
          className="bg-white p-10 rounded-2xl mb-8 border border-slate-200"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-light text-slate-900 mb-3 tracking-tight">
              {palette.paletteName}
            </h3>
            <p className="text-sm text-slate-700 font-light">{palette.description}</p>
          </div>

          <div className="grid grid-cols-5 gap-5">
            {palette.colors.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="h-32 w-full rounded-xl shadow-sm mb-3 border border-slate-100"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="font-light text-sm text-slate-900 mb-2">
                  {color.name}
                </p>
                <p className="text-xs text-slate-600 font-mono font-light">
                  {color.pantoneCode}
                </p>
                <p className="text-xs text-slate-600 font-mono font-light">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={downloadPaletteImage}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200"
        >
          팔레트를 이미지로 다운로드
        </button>

        <div className="mt-10 p-5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-400 font-light">
            Pantone 코드나 Hex 코드를 클릭하여 복사할 수 있습니다
          </p>
        </div>
      </div>

      {/* 리서치 섹션 */}
      {palette.research && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 animate-fadeIn">
          <h2 className="text-4xl font-light text-slate-900 dark:text-white mb-8 tracking-tight">
            인테리어 리서치
          </h2>

          <div
            ref={researchRef}
            className="bg-white p-10 rounded-2xl border border-slate-200 mb-8"
            dangerouslySetInnerHTML={{
              __html: palette.research,
            }}
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#333333",
            }}
          />

          {palette.researchImages && palette.researchImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-light text-slate-900 mb-6 tracking-tight">
                참고 이미지
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {palette.researchImages.map((image: any, index: number) => (
                  <a
                    key={index}
                    href={image.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-4 bg-white dark:bg-slate-700">
                      <p className="font-light text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                        {image.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-light">
                        Pinterest에서 보기
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={downloadResearchImage}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200"
          >
            리서치를 이미지로 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
