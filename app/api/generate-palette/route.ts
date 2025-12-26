import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic"

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 구독 상태 체크
    const hasSubscription = await checkSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json(
        { error: "유효한 구독이 필요합니다." },
        { status: 403 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    // Gemini 모델 설정
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Step 1: 3개의 컬러 팔레트 생성
    const palettePrompt = `당신은 전문 인테리어 디자이너이자 컬러 전문가입니다. 다음 프롬프트에 따른 Pantone 컬러 팔레트를 생성하세요:

프롬프트: ${prompt}

다음 JSON 형식으로 3개의 서로 다른 팔레트를 추천하세요. 각 팔레트는 정확히 5개의 Pantone 컬러를 포함해야 합니다:

[
  {
    "paletteName": "팔레트 이름 (한국어)",
    "description": "이 팔레트의 특징을 2-3문장으로 설명 (한국어)",
    "colors": [
      {
        "name": "Pantone 컬러 이름",
        "pantoneCode": "Pantone 코드 (예: PANTONE 19-4052)",
        "hex": "#hex코드",
        "usage": "이 컬러의 추천 사용처",
        "description": "컬러 설명"
      }
    ]
  }
]

중요: 반드시 유효한 JSON 배열만 반환하고, 추가 설명이나 마크다운은 포함하지 마세요.`;

    const paletteResult = await model.generateContent(palettePrompt);
    const paletteText = paletteResult.response.text();
    let cleanPaletteText = paletteText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const palettes = JSON.parse(cleanPaletteText);

    // Validate palettes response
    if (!Array.isArray(palettes) || palettes.length === 0) {
      throw new Error("팔레트 응답 형식이 잘못되었습니다.");
    }

    // 각 팔레트가 올바른 형식인지 확인
    for (const palette of palettes) {
      if (!palette.colors || !Array.isArray(palette.colors)) {
        throw new Error("팔레트 응답 형식이 잘못되었습니다.");
      }
    }

    // Step 2: 팔레트만 반환 (리서치 정보 제외)
    const results = [];

    for (const palette of palettes) {
      results.push({
        ...palette,
      });
    }

    return NextResponse.json({
      palettes: results,
    });
  } catch (error) {
    console.error("Error generating palette:", error);
    return NextResponse.json(
      { error: "팔레트 생성 중 오류가 발생했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}
