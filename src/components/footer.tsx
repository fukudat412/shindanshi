import Link from "next/link";
import { BookOpen } from "lucide-react";

// lucide-react 1.0 でブランドアイコンが削除されたため、GitHub のマークは Octicons（mark-github-16）の SVG を使う
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* ブランド */}
          <div>
            <Link
              href="/"
              className="font-bold text-lg text-primary flex items-center gap-2 mb-3"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                診
              </span>
              診断士学習
            </Link>
            <p className="text-sm text-muted-foreground">
              中小企業診断士試験対策の無料学習プラットフォーム
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-semibold mb-3">学習</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/subjects" className="text-muted-foreground hover:text-foreground transition-colors">
                  科目一覧
                </Link>
              </li>
              <li>
                <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
                  ランダム演習
                </Link>
              </li>
              <li>
                <Link href="/weakness" className="text-muted-foreground hover:text-foreground transition-colors">
                  弱点分析
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-muted-foreground hover:text-foreground transition-colors">
                  学習統計
                </Link>
              </li>
            </ul>
          </div>

          {/* その他 */}
          <div>
            <h3 className="font-semibold mb-3">その他</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  管理画面
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/fukudat412/shindanshi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <GithubMark className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            SM-2アルゴリズムによる間隔反復学習
          </p>
          <p>&copy; {new Date().getFullYear()} 診断士学習</p>
        </div>
      </div>
    </footer>
  );
}
