# 0005 選択肢の表示順をサーバー側でシャッフル
- クライアント描画中の乱数はサーバー描画とずれるため、page.tsx（Server Component）で shuffleChoicesForDisplay を通してから Client に渡す。判定は値ベース（judgeAnswer）なので結果は変わらない。
- practice の sort(() => Math.random() - 0.5) は偏りがあるので shuffle に置き換えた。
