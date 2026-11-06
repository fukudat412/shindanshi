# 0011 過去問の取り込み画面

- 照合キーは (subjectId, examYear, examQuestionNumber, examSubQuestionNumber)。subjectId は Article 経由で得る。入力内で同じキーが複数ある場合、duplicateIndexes には該当する全ての index（最初の出現も含む）を入れ、どれも書き込まない。
- 作成・更新は `prisma.$transaction([...])`（配列形式）で1トランザクションにまとめる。
