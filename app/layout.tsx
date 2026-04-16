import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 【追加】さっき作った魔法のコンポーネントを読み込む
import ThemeApplier from "./ThemeApplier";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Nikki",
  description: "おしゃれな日記アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* 【追加】すべての画面の裏でテーマの色とフォントを監視して切り替えてくれる */}
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}