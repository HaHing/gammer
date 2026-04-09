import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gammer — AI Presentation Engine",
  description: "Professional AI-powered presentation generator with consulting-grade content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
