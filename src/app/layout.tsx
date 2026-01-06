import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { Providers } from "@/components/providers";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "中小企業診断士 学習サイト",
  description: "中小企業診断士試験の学習を支援する無料学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Providers>
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="font-bold text-lg text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                    診
                  </span>
                  <span className="hidden sm:inline">診断士学習</span>
                </Link>

                {/* デスクトップナビゲーション */}
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/subjects" label="科目一覧" />
                  <NavLink href="/practice" label="ランダム演習" />
                  <NavLink href="/mock-exam" label="模擬試験" />
                  <NavLink href="/weakness" label="弱点分析" />
                  <NavLink href="/stats" label="学習統計" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* テーマ切替 */}
                <ThemeToggle />

                {/* デスクトップ管理リンク */}
                <Link
                  href="/admin"
                  className="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
                >
                  管理
                </Link>

                {/* ユーザーメニュー */}
                <UserMenu />

                {/* モバイルナビゲーション */}
                <MobileNav />
              </div>
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
