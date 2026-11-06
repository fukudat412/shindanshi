# 0012 Quiz に検証状態（VerificationStatus）を持たせる

- Quiz に verificationStatus（DRAFT/VERIFIED/NEEDS_FIX/REJECTED、既定 DRAFT）を追加。仕様の「verified と過去問だけを出題する」を満たすため。既存の問題も DRAFT から始まる。
- 出題可否の判定は `src/lib/quiz-eligibility.ts` の `isServableQuiz` と `servableQuizWhere` に集約（過去問は検証状態によらず出題）。適用は T-018、管理画面は T-019。
