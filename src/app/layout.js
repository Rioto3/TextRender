import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Geistフォント設定（ラテンとJapanese（日本語）のサブセットを追加）
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  // 注: Geistフォント自体は日本語に対応していないため、
  // 実際の日本語表示はフォールバックフォントで行われます
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// メタデータ更新
export const metadata = {
  title: "TextRender - 動画用テキスト生成ツール",
  description: "YouTubeショート・SNS動画用のテキストオーバーレイを簡単に作成できるツール",
  keywords: "テキスト生成, 動画編集, YouTube, ショート動画, オーバーレイ, 透明背景",
  creator: "Rioto Moriya",
};

export default function RootLayout({ children }) {
  return (
    // 言語設定を日本語に変更
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#90EE90" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="py-4 px-6 border-b">
          <h1 className="text-xl font-bold">TextRender - テキスト画像生成ツール</h1>
        </header>
        <main>
          {children}
        </main>
        <footer className="py-3 px-6 border-t text-sm text-gray-500 text-center">
          © 2025 Rioto Moriya - バイク動画制作支援ツール
        </footer>
      </body>
    </html>
  );
}