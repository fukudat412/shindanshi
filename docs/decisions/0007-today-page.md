# 0007 今日のキュー画面
- /today は全 Quiz を取得して buildTodayQueue で絞る（件数が増えたら DB 側で絞る。今は仕様どおり単純に）。
- QuizClient の Quiz に任意の label を足した（ヘッダーに Badge 表示）。
