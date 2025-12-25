import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { paletteName, description, colors } = await request.json();

    if (!paletteName || !colors) {
      return NextResponse.json(
        { error: "팔레트 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // Pexels API 키 확인
    if (!process.env.PEXELS_API_KEY) {
      console.error("PEXELS_API_KEY is not set");
      return NextResponse.json(
        { error: "Pexels API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 팔레트에 어울리는 이미지 검색 쿼리 생성 (영어)
    const searchPrompt = `You are an interior design image search expert. Based on the following color palette, generate search queries to find relevant INTERIOR DESIGN and HOME DECOR images only.

Palette Name: ${paletteName}
Palette Description: ${description}
Colors Used: ${colors.map((c: any) => `${c.name}(${c.hex})`).join(", ")}

Generate 5 specific English search queries focused on interior design, home decor, living spaces, furniture, and room design. Each query must include interior design keywords.

Examples of good queries:
- "modern living room interior design"
- "minimalist bedroom furniture"
- "scandinavian kitchen interior"
- "luxury home decor"
- "contemporary interior design"

Return JSON format:

{
  "searches": [
    {
      "query": "specific interior design search query with keywords like living room, bedroom, kitchen, furniture, interior, design, decor, home",
      "description": "room or design type description"
    }
  ]
}

Return ONLY valid JSON, no additional text.`;

    const searchResult = await model.generateContent(searchPrompt);
    let searchText = searchResult.response.text();
    searchText = searchText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let searches = [];
    try {
      const searchData = JSON.parse(searchText);
      searches = searchData.searches || [];
    } catch (e) {
      console.error("Failed to parse search queries:", e);
      return NextResponse.json(
        { error: "검색 쿼리 생성에 실패했습니다." },
        { status: 400 }
      );
    }

    if (searches.length === 0) {
      return NextResponse.json(
        { error: "검색 쿼리를 생성할 수 없습니다." },
        { status: 400 }
      );
    }

    // 여러 이미지 소스에서 검색
    const images = [];

    for (const search of searches.slice(0, 5)) {
      try {
        // Pexels에서 검색
        const pexelsResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(search.query)}&per_page=2`,
          {
            headers: {
              Authorization: process.env.PEXELS_API_KEY!,
            },
            next: { revalidate: 60 },
          }
        );

        if (!pexelsResponse.ok) {
          console.error(`Pexels API error: ${pexelsResponse.status} ${pexelsResponse.statusText}`);
          continue;
        }

        const pexelsData = await pexelsResponse.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          for (const photo of pexelsData.photos.slice(0, 1)) {
            images.push({
              url: photo.src.large || photo.src.medium,
              alt: search.description,
              photographer: photo.photographer || "Unknown",
              photographerUrl: photo.photographer_url || "#",
              source: "Pexels",
            });
          }
        }

        // 조기 종료 - 충분한 이미지를 찾으면 계속 검색하지 않음
        if (images.length >= 4) break;
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    }

    // 이미지가 없으면 기본 쿼리로 재검색
    if (images.length === 0) {
      try {
        const fallbackQueries = [
          "modern interior design living room",
          "contemporary home decor bedroom",
          "minimalist apartment interior",
          "scandinavian home design",
          "luxury interior design",
        ];
        
        for (const fallbackQuery of fallbackQueries) {
          const pexelsResponse = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=2`,
            {
              headers: {
                Authorization: process.env.PEXELS_API_KEY!,
              },
              next: { revalidate: 60 },
            }
          );

          if (!pexelsResponse.ok) {
            console.error(`Pexels fallback error: ${pexelsResponse.status}`);
            continue;
          }

          const pexelsData = await pexelsResponse.json();
          if (pexelsData.photos && pexelsData.photos.length > 0) {
            for (const photo of pexelsData.photos.slice(0, 1)) {
              images.push({
                url: photo.src.large || photo.src.medium,
                alt: "Interior design inspiration",
                photographer: photo.photographer || "Unknown",
                photographerUrl: photo.photographer_url || "#",
                source: "Pexels",
              });
            }
          }
          if (images.length >= 4) break;
        }
      } catch (error) {
        console.error("Failed to fetch fallback images:", error);
      }
    }

    return NextResponse.json({
      paletteName,
      images: images.slice(0, 5),
    });
  } catch (error) {
    console.error("Error searching similar images:", error);
    return NextResponse.json(
      { error: "유사 이미지 검색 중 오류가 발생했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}
