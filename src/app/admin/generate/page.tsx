import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wand2 } from "lucide-react";
import { GenerateForm } from "./generate-form";
import { getTopicsWithArticles } from "./actions";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const topics = await getTopicsWithArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-600">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">問題生成</h1>
            <p className="text-sm text-muted-foreground">
              論点から複数の問題を一括作成
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テンプレートから問題生成</CardTitle>
          <CardDescription>
            論点を選択すると、5つのテンプレート問題が自動生成されます。
            内容を編集して一括登録できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>論点が登録されていません。</p>
              <p className="mt-2">
                <Link href="/admin/topics" className="text-primary hover:underline">
                  論点を追加
                </Link>
                してから問題を生成してください。
              </p>
            </div>
          ) : (
            <GenerateForm topics={topics} />
          )}
        </CardContent>
      </Card>

      {/* テンプレート説明 */}
      <Card>
        <CardHeader>
          <CardTitle>問題テンプレートガイド</CardTitle>
          <CardDescription>
            各フェーズに応じた問題を作成することで、学習効果を高めます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700">INTRO（導入）</h4>
              <p className="text-sm text-blue-600 mt-1">
                用語の定義を○×または短文で確認。初学者向けの基礎的な問題。
              </p>
              <p className="text-xs text-blue-500 mt-2">
                例：「NPVとは、将来CFの現在価値から初期投資を引いた値である」→○×
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700">UNDERSTAND（理解）</h4>
              <p className="text-sm text-green-600 mt-1">
                判断基準や手順の理解を確認。4択で正しい判断を選ぶ。
              </p>
              <p className="text-xs text-green-500 mt-2">
                例：「NPV計算の正しい手順はどれか」→ A. CF予測→割引→差引
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-700">RETAIN（定着）</h4>
              <p className="text-sm text-orange-600 mt-1">
                ひっかけ問題で定着度を確認。よくある誤解や逆方向の問題。
              </p>
              <p className="text-xs text-orange-500 mt-2">
                例：「NPVについて誤っているものはどれか」→ C. 常に最大を選ぶべき
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700">EXAM（試験対策）</h4>
              <p className="text-sm text-purple-600 mt-1">
                短い文章を読んで判断するミニケース。実践的な問題。
              </p>
              <p className="text-xs text-purple-500 mt-2">
                例：「A社の投資案（初期1億、年CF3千万、5年）の判断は？」
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
