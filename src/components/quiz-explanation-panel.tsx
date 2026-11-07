import { Lightbulb } from "lucide-react";
import type { ChoiceFeedback } from "@/lib/quiz-explanation";
import { UnverifiedExplanationNote } from "@/components/unverified-explanation-note";

// 回答後の解説ブロック。表示だけを担当する（Server Action や DB には触れない）。
// unverified のときは、解説がまだ確認されていないことを書き添える
export function QuizExplanationPanel({
  explanation,
  choiceFeedback,
  basis,
  basisYear,
  unverified = false,
}: {
  explanation: string | null;
  choiceFeedback: ChoiceFeedback[];
  basis: string | null;
  basisYear: number | null;
  unverified?: boolean;
}) {
  if (!explanation && choiceFeedback.length === 0 && !basis && basisYear === null) {
    return null;
  }

  return (
    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
      {explanation && (
        <div>
          <div className="flex items-center gap-2 font-medium mb-2 text-primary">
            <Lightbulb className="w-4 h-4" />
            解説
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      )}
      {choiceFeedback.length > 0 && (
        <ul className="space-y-2">
          {choiceFeedback.map((choice, index) => (
            <li key={index} className="text-sm leading-relaxed">
              <div>
                <span className="font-medium">{choice.isCorrect ? "正しい" : "誤り"}</span>
                <span className="ml-2">{choice.text}</span>
              </div>
              {choice.explanation && (
                <p className="text-muted-foreground whitespace-pre-wrap">{choice.explanation}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {basis && (
        <div>
          <div className="font-medium mb-1 text-primary">根拠</div>
          <p className="text-sm leading-relaxed">{basis}</p>
        </div>
      )}
      {basisYear !== null && (
        <p className="text-sm text-muted-foreground">基準年度: {basisYear}年度</p>
      )}
      {unverified && <UnverifiedExplanationNote />}
    </div>
  );
}
