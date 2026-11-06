# 過去問の取り込み（/admin/import）

管理画面の「過去問の取り込み」に、JSON の配列を貼り付けて取り込む。

- 同じ「科目・年度・問番号・設問番号」の問題がすでにあれば更新し、なければ追加する。
- 1 件でもエラーがあれば何も書き込まない。エラーは何件目の何が悪いかで表示される。
- 取り込んだ問題は過去問（PAST_EXAM）になり、検証状態に関係なくすぐ出題される。

## 例

```json
[
  {
    "articleId": "cmk1j135p0008m8u2blnnfw1t",
    "examYear": 2025,
    "examQuestionNumber": 12,
    "examSubQuestionNumber": 1,
    "quizType": "MULTIPLE_CHOICE",
    "question": "（問題文）",
    "choices": ["ア （選択肢ア）", "イ （選択肢イ）", "ウ （選択肢ウ）", "エ （選択肢エ）"],
    "answer": "ウ （選択肢ウ）",
    "explanation": "（全体の解説）",
    "choiceExplanations": ["（アの理由）", "（イの理由）", "（ウの理由）", "（エの理由）"],
    "basis": "（根拠の条文・通達など）",
    "basisYear": 2025
  },
  {
    "articleId": "cmk1j17vo002hm8u2lrsc3kki",
    "examYear": 2024,
    "examQuestionNumber": 3,
    "quizType": "TRUE_FALSE",
    "question": "（正誤を問う文）",
    "answer": "false"
  }
]
```

## 項目

| 項目 | 必須 | 内容 |
|---|---|---|
| `articleId` | ○ | 問題をぶら下げる記事の ID。科目は記事から決まる |
| `examYear` | ○ | 試験の年度（西暦、2001〜2100）。画面では和暦で表示される |
| `examQuestionNumber` | ○ | 第何問か（1 以上） |
| `examSubQuestionNumber` |  | 設問番号（1 以上）。設問がなければ書かない |
| `quizType` | ○ | `MULTIPLE_CHOICE`・`TRUE_FALSE`・`SHORT_TEXT`・`NUMBER` |
| `question` | ○ | 問題文 |
| `answer` | ○ | 正解（文字列）。下の決まりを参照 |
| `choices` |  | 選択肢（文字列の配列）。`MULTIPLE_CHOICE` では 2 つ以上必要で、同じ文字列は使えない |
| `explanation` |  | 全体の解説 |
| `choiceExplanations` |  | 選択肢ごとの解説。書くなら `choices` と同じ数・同じ順 |
| `basis` |  | 根拠（条文・通達など） |
| `basisYear` |  | 根拠の基準年度（1900〜2100） |
| `topicId` |  | 論点の ID |

`answer` の決まり:

- `MULTIPLE_CHOICE`: `choices` のどれかと完全に同じ文字列にする。選択肢が `"ウ （…）"` なら、`"ウ"` だけでは通らない
- `TRUE_FALSE`: `"true"` か `"false"`
- `NUMBER`: 数値として読める文字列（`"1500"`。カンマは入れない）

## 記事 ID の調べ方

```bash
docker compose exec -T db psql -U shindanshi -d shindanshi -At -F ' | ' \
  -c 'select s.name, a.title, a.id from articles a join subjects s on s.id = a.subject_id order by s."order", a."order";'
```

`npm run db:studio` で articles テーブルを開いても確認できる。
