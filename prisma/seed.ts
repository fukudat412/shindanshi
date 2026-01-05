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

  // 財務比率分析の記事
  const ratioArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "財務比率分析の基礎",
      tags: ["財務分析", "経営分析", "財務諸表"],
      order: 3,
      bodyMd: `# 財務比率分析とは

財務比率分析は、財務諸表の数値を用いて企業の財務状態や経営成績を分析する手法です。

## 収益性分析

### ROE（自己資本利益率）
$$ROE = \\frac{当期純利益}{自己資本} \\times 100\\%$$

株主から見た収益性を示す最も重要な指標。

### ROA（総資産利益率）
$$ROA = \\frac{当期純利益}{総資産} \\times 100\\%$$

企業全体の資産効率を示す。

### 売上高営業利益率
$$売上高営業利益率 = \\frac{営業利益}{売上高} \\times 100\\%$$

本業での収益力を示す。

## 安全性分析

### 流動比率
$$流動比率 = \\frac{流動資産}{流動負債} \\times 100\\%$$

短期的な支払能力を示す。**200%以上**が望ましい。

### 当座比率
$$当座比率 = \\frac{当座資産}{流動負債} \\times 100\\%$$

より厳密な短期支払能力。**100%以上**が望ましい。

### 自己資本比率
$$自己資本比率 = \\frac{自己資本}{総資本} \\times 100\\%$$

長期的な財務安定性を示す。

## 効率性分析

### 総資産回転率
$$総資産回転率 = \\frac{売上高}{総資産}$$（回）

資産がどれだけ効率的に売上を生んでいるか。

### 売上債権回転期間
$$売上債権回転期間 = \\frac{売上債権}{売上高} \\times 365$$（日）

売上債権の回収にかかる日数。

### 棚卸資産回転期間
$$棚卸資産回転期間 = \\frac{棚卸資産}{売上高} \\times 365$$（日）

在庫が販売されるまでの日数。

## ROEの分解（デュポン分析）

$$ROE = \\frac{当期純利益}{売上高} \\times \\frac{売上高}{総資産} \\times \\frac{総資産}{自己資本}$$

= 売上高純利益率 × 総資産回転率 × 財務レバレッジ
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: ratioArticle.id,
        question: "ROEは「当期純利益÷総資産」で計算される",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "ROEは「当期純利益÷自己資本」で計算されます。「当期純利益÷総資産」はROA（総資産利益率）です。",
        order: 1,
      },
      {
        articleId: ratioArticle.id,
        question: "流動比率は200%以上が望ましいとされる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "流動比率は短期的な支払能力を示し、流動資産が流動負債の2倍以上（200%以上）あることが望ましいとされています。",
        order: 2,
      },
      {
        articleId: ratioArticle.id,
        question: "当座比率の計算に棚卸資産は含まれる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "当座比率は「当座資産÷流動負債」で計算され、当座資産には棚卸資産は含まれません。当座資産は現金、預金、売掛金、受取手形、有価証券などです。",
        order: 3,
      },
      {
        articleId: ratioArticle.id,
        question:
          "自己資本200万円、総資産500万円の場合、自己資本比率は何%か？",
        quizType: "NUMBER",
        answer: "40",
        explanation:
          "自己資本比率 = 自己資本 ÷ 総資本 × 100 = 200 ÷ 500 × 100 = 40%",
        order: 4,
      },
      {
        articleId: ratioArticle.id,
        question:
          "当期純利益50万円、自己資本500万円の場合、ROEは何%か？",
        quizType: "NUMBER",
        answer: "10",
        explanation:
          "ROE = 当期純利益 ÷ 自己資本 × 100 = 50 ÷ 500 × 100 = 10%",
        order: 5,
      },
      {
        articleId: ratioArticle.id,
        question: "財務レバレッジが高いほどROEは低くなる傾向がある",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "デュポン分析によれば、ROE = 売上高純利益率 × 総資産回転率 × 財務レバレッジです。財務レバレッジが高いほど、他の条件が同じならROEは高くなります。ただし、過度な負債はリスクを高めます。",
        order: 6,
      },
    ],
  });

  // WACC記事
  const waccArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "WACC（加重平均資本コスト）",
      tags: ["WACC", "資本コスト", "ファイナンス"],
      order: 4,
      bodyMd: `# WACC（加重平均資本コスト）とは

WACC（Weighted Average Cost of Capital）は、企業が資金調達するための平均的なコストを表します。

## 計算式

$$WACC = \\frac{E}{E+D} \\times r_E + \\frac{D}{E+D} \\times r_D \\times (1 - T)$$

- E: 自己資本（株主資本）の時価
- D: 負債の時価
- $r_E$: 株主資本コスト
- $r_D$: 負債コスト（借入金利）
- T: 法人税率

## なぜ負債コストに(1-T)を掛けるのか？

支払利息は**損金算入**されるため、税金を節約する効果（**タックスシールド**）があります。

例：利息100万円、税率30%の場合
- 税引前の利息コスト: 100万円
- 税引後の実質コスト: 100万円 × (1 - 0.3) = 70万円

## 株主資本コストの算定（CAPM）

$$r_E = r_f + \\beta \\times (r_m - r_f)$$

- $r_f$: リスクフリーレート（国債利回りなど）
- $\\beta$: ベータ値（市場全体との連動性）
- $r_m$: 市場期待収益率
- $(r_m - r_f)$: マーケットリスクプレミアム

## WACCの活用

1. **投資判断の割引率**: NPV計算の割引率として使用
2. **企業価値評価**: DCF法での割引率
3. **ハードルレート**: 投資案件の最低要求収益率

## 具体例

- 自己資本: 600万円（株主資本コスト12%）
- 負債: 400万円（借入金利4%）
- 法人税率: 30%

$$WACC = \\frac{600}{1000} \\times 12\\% + \\frac{400}{1000} \\times 4\\% \\times (1-0.3)$$
$$= 0.6 \\times 12\\% + 0.4 \\times 4\\% \\times 0.7$$
$$= 7.2\\% + 1.12\\% = 8.32\\%$$
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: waccArticle.id,
        question: "WACCの計算において、負債コストには税効果を考慮する必要がある",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "支払利息は損金算入されるため、税金を節約する効果（タックスシールド）があります。そのため、負債コストには(1-税率)を掛けて税引後の実質コストを算出します。",
        order: 1,
      },
      {
        articleId: waccArticle.id,
        question: "CAPMにおいて、ベータ値が1より大きい株式は市場平均より変動が小さい",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "ベータ値が1より大きい株式は市場平均より変動が大きく、ベータ値が1より小さい株式は市場平均より変動が小さいです。ベータ=1なら市場と同じ変動性を持ちます。",
        order: 2,
      },
      {
        articleId: waccArticle.id,
        question: "負債比率が高まるとWACCは必ず低下する",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "負債コストは株主資本コストより一般的に低いため、負債比率を高めるとWACCは低下する傾向があります。しかし、過度な負債は財務リスクを高め、株主資本コストや負債コストが上昇するため、必ずしも低下するとは限りません。",
        order: 3,
      },
      {
        articleId: waccArticle.id,
        question:
          "リスクフリーレート2%、ベータ1.5、マーケットリスクプレミアム6%の場合、CAPMによる株主資本コストは何%か？",
        quizType: "NUMBER",
        answer: "11",
        explanation:
          "株主資本コスト = リスクフリーレート + ベータ × マーケットリスクプレミアム = 2% + 1.5 × 6% = 2% + 9% = 11%",
        order: 4,
      },
      {
        articleId: waccArticle.id,
        question: "WACCはNPV計算における割引率として使用される",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "WACCは企業の資金調達コストを表し、投資プロジェクトのNPV計算における割引率として広く使用されます。投資案件はWACCを上回るリターンを生み出す必要があります。",
        order: 5,
      },
    ],
  });

  // キャッシュフロー計算書の記事
  const cfArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "キャッシュフロー計算書の読み方",
      tags: ["キャッシュフロー", "財務諸表", "CF計算書"],
      order: 5,
      bodyMd: `# キャッシュフロー計算書とは

キャッシュフロー計算書（C/F）は、一定期間の現金および現金同等物の増減を示す財務諸表です。

## 3つの活動区分

### 1. 営業活動によるキャッシュフロー（営業CF）

本業から生み出される現金の流れ。

**プラスの例**:
- 商品販売による現金収入
- サービス提供による現金収入

**マイナスの例**:
- 仕入代金の支払い
- 人件費の支払い
- 税金の支払い

### 2. 投資活動によるキャッシュフロー（投資CF）

設備投資や有価証券の売買による現金の流れ。

**通常マイナス**（成長企業の場合）:
- 固定資産の取得
- 有価証券の取得
- 子会社株式の取得

**プラスになる場合**:
- 固定資産の売却
- 有価証券の売却

### 3. 財務活動によるキャッシュフロー（財務CF）

資金調達と返済による現金の流れ。

**プラスの例**:
- 借入金の調達
- 社債の発行
- 株式の発行

**マイナスの例**:
- 借入金の返済
- 配当金の支払い
- 自己株式の取得

## フリーキャッシュフロー（FCF）

$$FCF = 営業CF + 投資CF$$

または

$$FCF = 営業CF - 設備投資額$$

企業が自由に使える現金。株主への還元や借入返済の原資となる。

## 健全な企業のパターン

| 営業CF | 投資CF | 財務CF | 状態 |
|--------|--------|--------|------|
| ＋ | － | － | 健全な成熟企業 |
| ＋ | － | ＋ | 成長期企業 |
| ＋ | ＋ | － | リストラ期 |
| － | ＋ | ＋ | 要注意（資産売却で延命）|

## 間接法による営業CFの計算

税引前当期純利益からスタートし、非現金項目を調整：

\`\`\`
税引前当期純利益
＋ 減価償却費（非現金費用）
＋ 引当金の増加
－ 売上債権の増加
＋ 仕入債務の増加
－ 棚卸資産の増加
＋ 受取利息・配当金
－ 支払利息
－ 法人税等の支払額
＝ 営業活動によるキャッシュフロー
\`\`\`
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: cfArticle.id,
        question: "健全な成長企業では、投資CFはプラスになる傾向がある",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "成長企業は積極的に設備投資や研究開発投資を行うため、投資CFはマイナスになる傾向があります。投資CFがプラスになるのは、資産売却などを行っている場合です。",
        order: 1,
      },
      {
        articleId: cfArticle.id,
        question: "減価償却費は営業CFを減少させる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "減価償却費は現金の支出を伴わない費用です。間接法では、税引前利益に減価償却費を加算して営業CFを計算するため、減価償却費は営業CFを増加させます。",
        order: 2,
      },
      {
        articleId: cfArticle.id,
        question: "フリーキャッシュフロー（FCF）は「営業CF＋投資CF」で計算される",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "フリーキャッシュフローは営業活動で稼いだ現金から、事業維持・成長に必要な投資を差し引いた、企業が自由に使える現金です。一般的に「営業CF＋投資CF」で計算されます。",
        order: 3,
      },
      {
        articleId: cfArticle.id,
        question: "売上債権が増加すると、間接法による営業CFは増加する",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "売上債権の増加は、売上が計上されたが現金を回収していない状態を意味します。間接法では、売上債権の増加は営業CFから差し引かれます。",
        order: 4,
      },
      {
        articleId: cfArticle.id,
        question: "配当金の支払いは営業CFに含まれる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "配当金の支払いは財務活動によるキャッシュフロー（財務CF）に含まれます。株主への利益還元は財務活動に分類されます。",
        order: 5,
      },
      {
        articleId: cfArticle.id,
        question: "借入金の返済は投資CFに含まれる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "借入金の返済は財務活動によるキャッシュフロー（財務CF）に含まれます。資金調達と返済に関する活動は財務CFに分類されます。",
        order: 6,
      },
    ],
  });

  // 原価計算の記事
  const costArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "原価計算の基礎",
      tags: ["原価計算", "管理会計", "製造原価"],
      order: 6,
      bodyMd: `# 原価計算とは

原価計算は、製品やサービスの原価を計算する手法です。

## 原価の分類

### 形態別分類
- **材料費**: 原材料、部品など
- **労務費**: 賃金、給料など
- **経費**: 減価償却費、水道光熱費など

### 製品との関連による分類
- **直接費**: 特定の製品に直接紐づけられる原価
  - 直接材料費、直接労務費、直接経費
- **間接費**: 複数の製品に共通して発生する原価
  - 間接材料費、間接労務費、間接経費

### 操業度との関連による分類
- **変動費**: 操業度に比例して変化（材料費など）
- **固定費**: 操業度に関係なく一定（減価償却費など）

## 製造原価の構成

\`\`\`
製造原価 = 直接材料費 + 直接労務費 + 製造間接費
\`\`\`

## 製造間接費の配賦

製造間接費は配賦基準を用いて各製品に配分します。

**配賦基準の例**:
- 直接作業時間
- 機械運転時間
- 直接材料費
- 直接労務費

$$製品への配賦額 = 製造間接費配賦率 \\times 配賦基準量$$

## 原価計算の種類

### 個別原価計算
- 受注生産に適用
- 製造指図書ごとに原価を集計
- 造船、建設など

### 総合原価計算
- 大量生産に適用
- 一定期間の原価を生産量で除して単位原価を計算
- 食品、化学製品など

## 標準原価計算

事前に設定した標準原価と実際原価を比較し、差異を分析。

**原価差異の種類**:
- **価格差異**: 実際価格と標準価格の差
- **数量差異**: 実際消費量と標準消費量の差

$$材料費差異 = (実際価格 - 標準価格) \\times 実際消費量 + 標準価格 \\times (実際消費量 - 標準消費量)$$
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: costArticle.id,
        question: "直接材料費は製造間接費に含まれる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "直接材料費は特定の製品に直接紐づけられる原価であり、直接費に分類されます。製造間接費には間接材料費、間接労務費、間接経費が含まれます。",
        order: 1,
      },
      {
        articleId: costArticle.id,
        question: "減価償却費は一般的に固定費に分類される",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "減価償却費は操業度（生産量）に関係なく一定額が発生するため、固定費に分類されます。",
        order: 2,
      },
      {
        articleId: costArticle.id,
        question: "個別原価計算は大量生産に適した原価計算方式である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "個別原価計算は受注生産（造船、建設など）に適した方式です。大量生産には総合原価計算が適しています。",
        order: 3,
      },
      {
        articleId: costArticle.id,
        question: "製造間接費の配賦基準として、直接作業時間は使用されない",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "直接作業時間は製造間接費の配賦基準として広く使用されます。他にも機械運転時間、直接材料費、直接労務費などが配賦基準として使用されます。",
        order: 4,
      },
      {
        articleId: costArticle.id,
        question: "標準原価計算における価格差異は、実際価格と標準価格の差から生じる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "価格差異は（実際価格－標準価格）×実際消費量で計算され、材料の購入価格が標準と異なることから生じます。",
        order: 5,
      },
    ],
  });

  // 現価係数の記事
  const pvArticle = await prisma.article.create({
    data: {
      subjectId: financeSubject.id,
      title: "現価係数と年金現価係数",
      tags: ["現価係数", "年金現価", "割引計算"],
      order: 7,
      bodyMd: `# 現価係数と年金現価係数

投資判断や企業価値評価で頻出する係数について解説します。

## 現価係数（複利現価係数）

将来の一時点で受け取る金額の現在価値を求める係数。

$$現価係数 = \\frac{1}{(1+r)^n}$$

- r: 割引率
- n: 年数

**例**: 3年後の100万円（割引率10%）の現在価値
$$100万円 \\times \\frac{1}{(1.1)^3} = 100万円 \\times 0.7513 = 75.13万円$$

## 年金現価係数

毎期一定額を受け取る場合の現在価値を求める係数。

$$年金現価係数 = \\frac{1-(1+r)^{-n}}{r}$$

または

$$年金現価係数 = \\frac{(1+r)^n - 1}{r \\times (1+r)^n}$$

**例**: 3年間毎年100万円（割引率10%）の現在価値
$$100万円 \\times 2.4869 = 248.69万円$$

## 主な係数表（割引率10%）

| 年数 | 現価係数 | 年金現価係数 |
|------|----------|--------------|
| 1年 | 0.9091 | 0.9091 |
| 2年 | 0.8264 | 1.7355 |
| 3年 | 0.7513 | 2.4869 |
| 4年 | 0.6830 | 3.1699 |
| 5年 | 0.6209 | 3.7908 |

## 終価係数

現在の金額が将来いくらになるかを求める係数。現価係数の逆数。

$$終価係数 = (1+r)^n$$

## 年金終価係数

毎期一定額を積み立てた場合の将来価値を求める係数。

$$年金終価係数 = \\frac{(1+r)^n - 1}{r}$$

## 計算問題のコツ

1. **現価係数**: 「将来の一時金」→「現在価値」
2. **年金現価係数**: 「毎年の定額」→「現在価値の合計」
3. **終価係数**: 「現在の金額」→「将来価値」
4. **年金終価係数**: 「毎年の積立」→「将来の合計」

## 永久年金の現在価値

毎期一定額が永久に続く場合：
$$永久年金の現在価値 = \\frac{年金額}{割引率}$$

**例**: 毎年10万円、割引率5%
$$\\frac{10万円}{0.05} = 200万円$$
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: pvArticle.id,
        question:
          "割引率10%の場合、1年後の100万円の現在価値は約91万円である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "現在価値 = 100万円 × 1/(1.1) = 100万円 × 0.9091 ≈ 91万円",
        order: 1,
      },
      {
        articleId: pvArticle.id,
        question: "年金現価係数は現価係数より常に大きい",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "1年目の場合、年金現価係数と現価係数は同じ値になります。2年目以降は年金現価係数の方が大きくなります（複数年の現価係数の合計のため）。",
        order: 2,
      },
      {
        articleId: pvArticle.id,
        question: "永久年金の現在価値は「年金額÷割引率」で計算できる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "毎期一定額が永久に続く場合、現在価値 = 年金額 ÷ 割引率 で計算できます。例えば、毎年10万円、割引率5%なら、10万円÷0.05=200万円です。",
        order: 3,
      },
      {
        articleId: pvArticle.id,
        question:
          "毎年100万円、割引率5%の永久年金の現在価値は何万円か？",
        quizType: "NUMBER",
        answer: "2000",
        explanation:
          "永久年金の現在価値 = 年金額 ÷ 割引率 = 100万円 ÷ 0.05 = 2000万円",
        order: 4,
      },
      {
        articleId: pvArticle.id,
        question: "終価係数は現価係数の逆数である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "現価係数 = 1/(1+r)^n、終価係数 = (1+r)^n なので、終価係数は現価係数の逆数です。",
        order: 5,
      },
      {
        articleId: pvArticle.id,
        question: "割引率が高いほど、現価係数は大きくなる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "割引率が高いほど、将来のお金の現在価値は小さくなります。したがって、現価係数は小さくなります。",
        order: 6,
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
