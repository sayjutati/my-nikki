import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// さっき作った魔法のコンポーネントを読み込む
import ThemeApplier from "./ThemeApplier";

const inter = Inter({ subsets: ["latin"] });

// 【追加】スマホでのズームを禁止したり、上のバーの色をアプリに合わせる設定
export const viewport: Viewport = {
  themeColor: "#fecdd3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 【変更】スマホアプリ化（PWA）の設定を追加
export const metadata: Metadata = {
  title: "My Nikki",
  description: "おしゃれな日記アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Nikki",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* すべての画面の裏でテーマの色とフォントを監視して切り替えてくれる */}
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}