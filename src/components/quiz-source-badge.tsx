import { Badge } from "@/components/ui/badge";

/** 出自・年度・問番号の表示。label が null なら何も描画しない */
export function QuizSourceBadge({ label }: { label: string | null }) {
  if (label === null) return null;
  return <Badge variant="secondary">{label}</Badge>;
}
