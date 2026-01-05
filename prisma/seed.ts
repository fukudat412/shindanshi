import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 科目を作成
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        name: "経済学・経済政策",
        order: 1,
      },
    }),
    prisma.subject.create({
      data: {
        name: "財務・会計",
        order: 2,
      },
    }),
    prisma.subject.create({
      data: {
        name: "企業経営理論",
        order: 3,
      },
    }),
    prisma.subject.create({
      data: {
        name: "運営管理",
        order: 4,
      },
    }),
    prisma.subject.create({
      data: {
        name: "経営法務",
        order: 5,
      },
    }),
    prisma.subject.create({
      data: {
        name: "経営情報システム",
        order: 6,
      },
    }),
    prisma.subject.create({
      data: {
        name: "中小企業経営・政策",
        order: 7,
      },
    }),
  ]);

  console.log(`Created ${subjects.length} subjects`);

  // 財務・会計の記事とクイズを作成
  const financeSubject = subjects.find((s) => s.name === "財務・会計")!;

  const npvArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "NPV（正味現在価値）の基礎",
      tags: ["NPV", "投資判断", "ファイナンス"],
      order: 1,
      bodyMd: `# NPV（正味現在価値）とは

NPV（Net Present Value：正味現在価値）は、投資の意思決定において最も重要な指標の一つです。

## 基本的な考え方

投資によって将来得られるキャッシュフローを、現在の価値に割り引いた総和から、初期投資額を差し引いた値がNPVです。

## 計算式

$$NPV = \\sum_{t=1}^{n} \\frac{CF_t}{(1+r)^t} - I_0$$

- $CF_t$: t期のキャッシュフロー
- $r$: 割引率（資本コスト）
- $I_0$: 初期投資額
- $n$: 投資期間

## 投資判断基準

| NPVの値 | 判断 |
|---------|------|
| NPV > 0 | 投資すべき |
| NPV = 0 | どちらでも良い |
| NPV < 0 | 投資すべきでない |

## 具体例

初期投資100万円、3年間毎年40万円のキャッシュフロー、割引率10%の場合：

\`\`\`
NPV = 40/(1.1) + 40/(1.1)² + 40/(1.1)³ - 100
    = 36.36 + 33.06 + 30.05 - 100
    = -0.53万円
\`\`\`

この場合、NPVがマイナスなので投資は見送るべきです。

## ポイント

1. **時間価値を考慮**: 将来の1万円より現在の1万円の方が価値が高い
2. **割引率の重要性**: 割引率が高いほどNPVは小さくなる
3. **複数案の比較**: NPVが最も大きい投資案を選択
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: npvArticle.id,
        question: "NPVがプラスの投資案は採用すべきである",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "NPVがプラスということは、投資によって企業価値が増加することを意味します。したがって、採用すべきです。",
        order: 1,
      },
      {
        articleId: npvArticle.id,
        question: "割引率が高くなるとNPVは大きくなる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "割引率が高くなると、将来のキャッシュフローの現在価値が小さくなるため、NPVは小さくなります。",
        order: 2,
      },
      {
        articleId: npvArticle.id,
        question:
          "初期投資100万円、1年後のキャッシュフロー110万円、割引率10%の場合、NPVは何万円か？（小数点以下切り捨て）",
        quizType: "NUMBER",
        answer: "0",
        explanation:
          "NPV = 110/(1.1) - 100 = 100 - 100 = 0万円となります。",
        order: 3,
      },
    ],
  });

  const cvpArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "CVP分析（損益分岐点分析）",
      tags: ["CVP", "損益分岐点", "管理会計"],
      order: 2,
      bodyMd: `# CVP分析とは

CVP分析（Cost-Volume-Profit Analysis）は、コスト・販売量・利益の関係を分析する手法です。損益分岐点分析とも呼ばれます。

## 基本用語

- **固定費（FC）**: 販売量に関係なく一定の費用
- **変動費（VC）**: 販売量に比例して変化する費用
- **変動費率**: 売上高に対する変動費の割合
- **限界利益**: 売上高 - 変動費
- **限界利益率**: 1 - 変動費率

## 損益分岐点売上高

損益分岐点売上高 = 固定費 ÷ 限界利益率

## 目標利益達成売上高

目標売上高 = (固定費 + 目標利益) ÷ 限界利益率

## 具体例

- 固定費: 300万円
- 変動費率: 60%
- 限界利益率: 40%

損益分岐点売上高 = 300万円 ÷ 0.4 = 750万円

## 安全余裕率

安全余裕率 = (実際売上高 - 損益分岐点売上高) ÷ 実際売上高 × 100%

安全余裕率が高いほど、売上減少に対する耐性が高いことを示します。
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: cvpArticle.id,
        question: "固定費が増加すると損益分岐点売上高は低下する",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "固定費が増加すると、それをカバーするためにより多くの売上が必要になるため、損益分岐点売上高は上昇します。",
        order: 1,
      },
      {
        articleId: cvpArticle.id,
        question:
          "固定費200万円、限界利益率40%の場合、損益分岐点売上高は何万円か？",
        quizType: "NUMBER",
        answer: "500",
        explanation:
          "損益分岐点売上高 = 固定費 ÷ 限界利益率 = 200 ÷ 0.4 = 500万円",
        order: 2,
      },
    ],
  });

  // 企業経営理論の記事を作成
  const managementSubject = subjects.find((s) => s.name === "企業経営理論")!;

  const porterArticle = await prisma.article.create({
    data: {
      subjectId: managementSubject.id,
      title: "ポーターの競争戦略",
      tags: ["ポーター", "競争戦略", "経営戦略"],
      order: 1,
      bodyMd: `# ポーターの競争戦略

マイケル・ポーターが提唱した競争戦略の基本フレームワークです。

## 3つの基本戦略

### 1. コストリーダーシップ戦略
- 業界で最も低いコストを実現
- 規模の経済、経験曲線効果を活用
- 価格競争で優位に立つ

### 2. 差別化戦略
- 製品やサービスの独自性を追求
- ブランド、品質、サービスで差別化
- プレミアム価格を設定可能

### 3. 集中戦略
- 特定のセグメントに経営資源を集中
- コスト集中 or 差別化集中
- ニッチ市場での競争優位

## 5つの競争要因（ファイブフォース）

1. **業界内の競争**: 既存企業間の競争の激しさ
2. **新規参入の脅威**: 参入障壁の高さ
3. **代替品の脅威**: 代替製品・サービスの存在
4. **買い手の交渉力**: 顧客の価格交渉力
5. **売り手の交渉力**: サプライヤーの価格交渉力

## スタック・イン・ザ・ミドル

複数の戦略を同時に追求しようとすると、どの戦略も中途半端になり、競争優位を獲得できなくなる状態。
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: porterArticle.id,
        question:
          "ポーターの3つの基本戦略とは、コストリーダーシップ、差別化、集中である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "ポーターは競争優位を獲得するための3つの基本戦略として、コストリーダーシップ戦略、差別化戦略、集中戦略を提唱しました。",
        order: 1,
      },
      {
        articleId: porterArticle.id,
        question: "ファイブフォースに「代替品の脅威」は含まれない",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "ファイブフォースには、業界内の競争、新規参入の脅威、代替品の脅威、買い手の交渉力、売り手の交渉力の5つが含まれます。",
        order: 2,
      },
    ],
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
