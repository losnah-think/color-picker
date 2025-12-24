import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pantone Color Palette Generator",
  description: "AI가 추천하는 실내 인테리어 컬러 팔레트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
