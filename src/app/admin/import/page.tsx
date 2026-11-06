import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ImportForm } from "./import-form";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">過去問の取り込み</h1>
          <p className="text-sm text-muted-foreground">JSON から過去問を一括登録・更新</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>JSON を貼り付け</CardTitle>
          <CardDescription>
            同じ科目・年度・問番号・設問番号の問題は更新し、重複させません。エラーがあるときは何も書き込みません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
