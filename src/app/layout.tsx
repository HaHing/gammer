import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gammer — 专业 AI 演示文稿",
  description: "落地·清晰·专业 — AI 驱动的咨询级 PPTX 生成平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
