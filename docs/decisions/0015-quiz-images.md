# 0015 問題の図を DB に保存する
- 過去問の図・グラフ・複雑な表を表示するため、QuizImage（PNG のバイト列・幅・高さ・順番）を追加した。リポジトリは公開なので、図はファイルとして git に置かず DB に入れ、`/api/quiz-images/[id]` から返す。取り込み直すと id が変わるので、長期キャッシュにしてよい。
- 取り込み JSON の `images` は base64 の PNG。図を含む JSON を管理画面に貼れるよう、Server Action の body 上限を 10MB にした（next.config.ts。1 年度・1 科目分は図を含めて 1〜2MB。全 Server Action に効くので、大きな送信でメモリを使われないよう 10MB にとどめる）。
