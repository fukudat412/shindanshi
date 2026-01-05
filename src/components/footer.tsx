import Link from "next/link";
import { BookOpen, Github } from "lucide-react";

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
                  <Github className="w-4 h-4" />
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
