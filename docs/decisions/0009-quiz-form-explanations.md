# 0009 クイズ作成フォームに解説・根拠・基準年度を追加
- 空の選択肢を除くとき解説の位置がずれないよう compactChoices を quiz-explanation.ts に追加。createQuiz は保存前に validateExplanationFields で検証する。
