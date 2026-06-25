import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gammer",
  description: "AI-powered presentation engine",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
