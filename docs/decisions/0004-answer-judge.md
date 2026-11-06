# 0004 回答判定を src/lib/answer-judge.ts に集約
- 4か所に重複していた正誤判定を judgeAnswer にまとめた。NUMBER は誤差 0.0001 未満、MULTIPLE_CHOICE は選択肢の値で比べる。
- quiz-client / practice-client の関数名 checkAnswer（ボタンのハンドラ）は残している。判定ロジックは持たない。
