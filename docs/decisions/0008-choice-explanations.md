# 0008 Quiz に選択肢ごとの解説・根拠・基準年度を追加
- choiceExplanations / basis / basisYear を Quiz に追加（既存問題は空配列・null）。解説は位置でなく選択肢の文字列で対応付ける（シャッフルしても崩れない）ため、MULTIPLE_CHOICE の選択肢の重複は検証で弾く。
- 対応付けと検証は src/lib/quiz-explanation.ts の純粋関数にまとめ、T-011（入力）・T-012（表示）・T-014（取り込み）から使う。
