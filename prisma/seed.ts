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
      {
        articleId: porterArticle.id,
        question: "スタック・イン・ザ・ミドルとは、一つの戦略に特化しすぎて失敗することである",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "スタック・イン・ザ・ミドルとは、複数の戦略を同時に追求しようとして、どの戦略も中途半端になり競争優位を獲得できなくなる状態を指します。",
        order: 3,
      },
      {
        articleId: porterArticle.id,
        question: "ファイブフォースにおいて、参入障壁が高い業界は収益性が低い傾向がある",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "参入障壁が高い業界は、新規参入者が入りにくいため、既存企業の収益性は高くなる傾向があります。",
        order: 4,
      },
    ],
  });

  // 経済学・経済政策の記事を作成
  const economicsSubject = subjects.find((s) => s.name === "経済学・経済政策")!;

  const macroArticle = await prisma.article.create({
    data: {
      subjectId: economicsSubject.id,
      title: "マクロ経済学の基礎",
      tags: ["GDP", "マクロ経済", "国民所得"],
      order: 1,
      bodyMd: `# マクロ経済学の基礎

マクロ経済学は、国民経済全体の動きを分析する学問です。

## GDP（国内総生産）

一定期間内に国内で生産されたすべての財・サービスの付加価値の合計。

### 三面等価の原則

$$生産 = 分配 = 支出$$

- **生産面**: 各産業の付加価値の合計
- **分配面**: 雇用者報酬 + 営業余剰 + 固定資本減耗 + 間接税 - 補助金
- **支出面**: C + I + G + (X - M)

### GDPの構成（支出面）

$$Y = C + I + G + (X - M)$$

- Y: GDP
- C: 消費
- I: 投資
- G: 政府支出
- X: 輸出
- M: 輸入

## 経済成長率

$$経済成長率 = \\frac{今期のGDP - 前期のGDP}{前期のGDP} \\times 100$$

## 名目GDPと実質GDP

- **名目GDP**: 当該年の価格で評価
- **実質GDP**: 基準年の価格で評価（物価変動を除去）

$$GDPデフレーター = \\frac{名目GDP}{実質GDP} \\times 100$$
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: macroArticle.id,
        question: "GDPは国内で生産された財・サービスの付加価値の合計である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "GDP（国内総生産）は、一定期間内に国内で生産されたすべての財・サービスの付加価値の合計です。",
        order: 1,
      },
      {
        articleId: macroArticle.id,
        question: "三面等価の原則では、生産・分配・支出は等しくならない",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "三面等価の原則では、生産面・分配面・支出面から見たGDPは等しくなります。",
        order: 2,
      },
      {
        articleId: macroArticle.id,
        question: "GDPの支出面の構成要素に政府支出（G）は含まれない",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "GDPの支出面は Y = C + I + G + (X - M) で表され、政府支出（G）は含まれます。",
        order: 3,
      },
      {
        articleId: macroArticle.id,
        question: "実質GDPは物価変動の影響を除去したGDPである",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "実質GDPは基準年の価格で評価するため、物価変動の影響を除去しています。名目GDPは当該年の価格で評価します。",
        order: 4,
      },
      {
        articleId: macroArticle.id,
        question: "GDPデフレーターが100より大きい場合、物価は基準年より上昇している",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "GDPデフレーター = 名目GDP / 実質GDP × 100 で計算され、100より大きければ基準年より物価が上昇しています。",
        order: 5,
      },
    ],
  });

  const microArticle = await prisma.article.create({
    data: {
      subjectId: economicsSubject.id,
      title: "ミクロ経済学の基礎",
      tags: ["需要", "供給", "市場均衡"],
      order: 2,
      bodyMd: `# ミクロ経済学の基礎

ミクロ経済学は、個々の経済主体（消費者・企業）の行動を分析します。

## 需要曲線

消費者が各価格でどれだけ購入するかを示す曲線。

- 価格が下がると需要量は増加（右下がり）
- 需要の価格弾力性: 価格変化に対する需要量の変化率

$$需要の価格弾力性 = \\frac{需要量の変化率}{価格の変化率}$$

## 供給曲線

生産者が各価格でどれだけ供給するかを示す曲線。

- 価格が上がると供給量は増加（右上がり）

## 市場均衡

需要曲線と供給曲線の交点で決まる価格と数量。

- **均衡価格**: 需要量と供給量が一致する価格
- **均衡数量**: 均衡価格における取引量

## 消費者余剰と生産者余剰

- **消費者余剰**: 支払ってもよいと思う価格 - 実際の価格
- **生産者余剰**: 実際の価格 - 最低限必要な価格
- **総余剰**: 消費者余剰 + 生産者余剰
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: microArticle.id,
        question: "需要曲線は通常、右下がりの形状をとる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "需要曲線は価格が下がると需要量が増加するため、通常は右下がりの形状をとります。",
        order: 1,
      },
      {
        articleId: microArticle.id,
        question: "供給曲線は通常、右下がりの形状をとる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "供給曲線は価格が上がると供給量が増加するため、通常は右上がりの形状をとります。",
        order: 2,
      },
      {
        articleId: microArticle.id,
        question: "市場均衡は需要曲線と供給曲線の交点で決まる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "市場均衡は需要曲線と供給曲線の交点で決まり、この点で均衡価格と均衡数量が定まります。",
        order: 3,
      },
      {
        articleId: microArticle.id,
        question: "消費者余剰とは、実際の価格から支払意思価格を引いたものである",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "消費者余剰は「支払ってもよいと思う価格 - 実際の価格」です。逆ではありません。",
        order: 4,
      },
      {
        articleId: microArticle.id,
        question: "需要の価格弾力性が1より大きい場合、需要は弾力的である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "価格弾力性が1より大きい場合、価格変化に対して需要量が大きく反応するため「弾力的」といいます。",
        order: 5,
      },
    ],
  });

  // 運営管理の記事を作成
  const operationsSubject = subjects.find((s) => s.name === "運営管理")!;

  const productionArticle = await prisma.article.create({
    data: {
      subjectId: operationsSubject.id,
      title: "生産管理の基礎",
      tags: ["生産方式", "在庫管理", "JIT"],
      order: 1,
      bodyMd: `# 生産管理の基礎

効率的な生産活動を実現するための管理手法を学びます。

## 生産方式の分類

### 受注形態による分類
- **見込生産（MTS: Make to Stock）**: 需要予測に基づき生産
- **受注生産（MTO: Make to Order）**: 注文を受けてから生産
- **受注組立生産（ATO）**: 部品を見込生産、受注後に組立

### 生産量による分類
- **個別生産**: 1回限りの特注品
- **ロット生産**: 一定数量をまとめて生産
- **連続生産**: 大量・継続的に生産

## 在庫管理

### 発注方式
- **定量発注方式**: 在庫が一定量を下回ったら発注
- **定期発注方式**: 一定期間ごとに発注

### 経済的発注量（EOQ）

$$EOQ = \\sqrt{\\frac{2DS}{H}}$$

- D: 年間需要量
- S: 1回あたり発注費用
- H: 単位あたり年間保管費用

## JIT（ジャストインタイム）

必要なものを、必要な時に、必要な量だけ生産・調達する方式。

- かんばん方式
- 平準化生産
- 多能工化
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: productionArticle.id,
        question: "見込生産（MTS）は需要予測に基づいて生産を行う方式である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "見込生産（Make to Stock）は、需要予測に基づいて事前に生産を行い、在庫として保管する方式です。",
        order: 1,
      },
      {
        articleId: productionArticle.id,
        question: "JIT（ジャストインタイム）は大量の在庫を持つことを推奨する",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "JITは必要なものを、必要な時に、必要な量だけ生産・調達する方式で、在庫を最小限に抑えることを目指します。",
        order: 2,
      },
      {
        articleId: productionArticle.id,
        question: "定量発注方式は、在庫が一定量を下回ったら発注する方式である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "定量発注方式は、在庫が発注点を下回ったら一定量を発注する方式です。定期発注方式は一定期間ごとに発注します。",
        order: 3,
      },
      {
        articleId: productionArticle.id,
        question: "経済的発注量（EOQ）は発注費用と保管費用の合計を最小化する",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "EOQは発注費用と保管費用のトレードオフを考慮し、総費用を最小化する発注量を求めます。",
        order: 4,
      },
      {
        articleId: productionArticle.id,
        question: "かんばん方式はJIT生産を実現するための仕組みである",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "かんばん方式は、後工程が前工程に必要な部品を引き取る「引っ張り方式」でJIT生産を実現します。",
        order: 5,
      },
    ],
  });

  const qualityArticle = await prisma.article.create({
    data: {
      subjectId: operationsSubject.id,
      title: "品質管理とQC七つ道具",
      tags: ["品質管理", "QC7つ道具", "統計的手法"],
      order: 2,
      bodyMd: `# 品質管理とQC七つ道具

品質管理の基本的なツールと手法を学びます。

## QC七つ道具

品質管理に用いる基本的な統計ツール：

1. **パレート図**: 問題を重要度順に並べた棒グラフと累積折れ線グラフ
2. **特性要因図（魚の骨図）**: 結果と原因の関係を整理
3. **ヒストグラム**: データの分布状況を可視化
4. **管理図**: 工程の安定性を時系列で監視
5. **散布図**: 2つの変数の相関関係を可視化
6. **チェックシート**: データを分類・整理して記録
7. **層別**: データをグループに分けて分析

## 新QC七つ道具

定性的な問題解決に用いるツール：

1. 親和図法
2. 連関図法
3. 系統図法
4. マトリックス図法
5. アローダイアグラム
6. PDPC法
7. マトリックスデータ解析法

## 管理図の種類

- **計量値管理図**: X̄-R管理図、X̄-s管理図
- **計数値管理図**: p管理図、np管理図、c管理図、u管理図
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: qualityArticle.id,
        question: "パレート図は問題を重要度順に並べ、重点項目を把握するのに用いる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "パレート図は問題を重要度（発生頻度など）順に棒グラフで並べ、累積折れ線グラフを加えて重点項目を把握します。",
        order: 1,
      },
      {
        articleId: qualityArticle.id,
        question: "特性要因図は別名「魚の骨図」とも呼ばれる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "特性要因図は、結果（特性）と原因（要因）の関係を魚の骨のような形で整理するため、「魚の骨図」「フィッシュボーンチャート」とも呼ばれます。",
        order: 2,
      },
      {
        articleId: qualityArticle.id,
        question: "散布図は2つの変数の相関関係を視覚化するために用いる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "散布図は横軸と縦軸にそれぞれ変数をとり、データの点をプロットして2つの変数間の相関関係を視覚化します。",
        order: 3,
      },
      {
        articleId: qualityArticle.id,
        question: "管理図は工程の安定性を時系列で監視するツールである",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "管理図は中心線と管理限界線を設け、データの推移を時系列でプロットして工程の安定性を監視します。",
        order: 4,
      },
      {
        articleId: qualityArticle.id,
        question: "新QC七つ道具には親和図法が含まれる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "新QC七つ道具は定性的な問題解決に用いるツールで、親和図法、連関図法、系統図法などが含まれます。",
        order: 5,
      },
    ],
  });

  // 経営法務の記事を作成
  const lawSubject = subjects.find((s) => s.name === "経営法務")!;

  const companyLawArticle = await prisma.article.create({
    data: {
      subjectId: lawSubject.id,
      title: "会社法の基礎",
      tags: ["会社法", "株式会社", "機関設計"],
      order: 1,
      bodyMd: `# 会社法の基礎

会社法は、会社の設立・組織・運営・解散について規定しています。

## 会社の種類

1. **株式会社**: 出資者（株主）が出資額を限度に責任を負う
2. **合同会社（LLC）**: 出資者全員が有限責任社員
3. **合名会社**: 出資者全員が無限責任社員
4. **合資会社**: 無限責任社員と有限責任社員が混在

## 株式会社の機関

### 必須機関
- **株主総会**: 最高意思決定機関
- **取締役**: 業務執行

### 任意機関
- 取締役会
- 監査役・監査役会
- 会計参与
- 会計監査人
- 監査等委員会
- 指名委員会等

## 株主総会

- **普通決議**: 出席株主の議決権の過半数
- **特別決議**: 出席株主の議決権の2/3以上
- **特殊決議**: 総株主の半数以上かつ議決権の2/3以上

## 取締役の義務

- **善管注意義務**: 善良な管理者としての注意義務
- **忠実義務**: 会社のために忠実に職務を行う義務
- **競業避止義務**: 会社と競合する取引の制限
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: companyLawArticle.id,
        question: "株式会社の株主は出資額を限度に責任を負う（有限責任）",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "株式会社の株主は間接有限責任を負い、出資額を超える責任を負うことはありません。",
        order: 1,
      },
      {
        articleId: companyLawArticle.id,
        question: "株主総会は株式会社の最高意思決定機関である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "株主総会は株式会社の最高意思決定機関であり、取締役の選任・解任、定款変更、合併などの重要事項を決定します。",
        order: 2,
      },
      {
        articleId: companyLawArticle.id,
        question: "株主総会の特別決議には出席株主の議決権の過半数が必要である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "特別決議には出席株主の議決権の2/3以上が必要です。過半数は普通決議の要件です。",
        order: 3,
      },
      {
        articleId: companyLawArticle.id,
        question: "合同会社（LLC）の社員は全員が有限責任である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "合同会社は全社員が有限責任社員で構成されます。無限責任社員がいるのは合名会社や合資会社です。",
        order: 4,
      },
      {
        articleId: companyLawArticle.id,
        question: "取締役には善管注意義務と忠実義務がある",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "取締役は善良な管理者としての注意義務（善管注意義務）と、会社のために忠実に職務を行う義務（忠実義務）を負います。",
        order: 5,
      },
    ],
  });

  const ipArticle = await prisma.article.create({
    data: {
      subjectId: lawSubject.id,
      title: "知的財産権の基礎",
      tags: ["知的財産", "特許", "商標", "著作権"],
      order: 2,
      bodyMd: `# 知的財産権の基礎

知的財産権は、知的創造活動の成果を保護する権利です。

## 産業財産権

### 特許権
- 発明（自然法則を利用した技術的思想の創作）を保護
- 存続期間: 出願から20年

### 実用新案権
- 物品の形状・構造・組み合わせに関する考案を保護
- 存続期間: 出願から10年

### 意匠権
- 物品のデザイン（形状・模様・色彩）を保護
- 存続期間: 出願から25年

### 商標権
- 商品・サービスを識別する標識を保護
- 存続期間: 登録から10年（更新可能）

## 著作権

- 著作物（思想・感情を創作的に表現したもの）を保護
- 著作者の死後70年まで保護
- 登録不要（創作と同時に発生）

## 営業秘密

不正競争防止法で保護される3要件：
1. 秘密管理性
2. 有用性
3. 非公知性
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: ipArticle.id,
        question: "特許権の存続期間は出願から20年である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "特許権の存続期間は出願日から20年です。医薬品などは延長される場合があります。",
        order: 1,
      },
      {
        articleId: ipArticle.id,
        question: "著作権は登録しなければ発生しない",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "著作権は創作と同時に発生する無方式主義を採用しており、登録は不要です。特許権などと異なります。",
        order: 2,
      },
      {
        articleId: ipArticle.id,
        question: "商標権は更新することで半永久的に保護できる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "商標権の存続期間は登録から10年ですが、更新することで半永久的に権利を維持できます。",
        order: 3,
      },
      {
        articleId: ipArticle.id,
        question: "意匠権の存続期間は出願から25年である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "2020年の法改正により、意匠権の存続期間は出願から25年に延長されました（以前は20年）。",
        order: 4,
      },
      {
        articleId: ipArticle.id,
        question: "営業秘密として保護されるには秘密管理性が必要である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "営業秘密の3要件は「秘密管理性」「有用性」「非公知性」です。これらすべてを満たす必要があります。",
        order: 5,
      },
    ],
  });

  // 経営情報システムの記事を作成
  const itSubject = subjects.find((s) => s.name === "経営情報システム")!;

  const networkArticle = await prisma.article.create({
    data: {
      subjectId: itSubject.id,
      title: "ネットワークの基礎",
      tags: ["ネットワーク", "TCP/IP", "プロトコル"],
      order: 1,
      bodyMd: `# ネットワークの基礎

コンピュータネットワークの基本的な概念を学びます。

## OSI参照モデル

7層構造のネットワークアーキテクチャ：

1. **物理層**: ビット伝送
2. **データリンク層**: フレーム伝送、MACアドレス
3. **ネットワーク層**: パケット転送、IPアドレス
4. **トランスポート層**: ポート番号、TCP/UDP
5. **セッション層**: セッション管理
6. **プレゼンテーション層**: データ形式変換
7. **アプリケーション層**: アプリケーションプロトコル

## TCP/IP

インターネットの標準プロトコル：

- **TCP**: 信頼性のある通信（コネクション型）
- **UDP**: 高速だが信頼性なし（コネクションレス型）
- **IP**: パケットのルーティング

## IPアドレス

- **IPv4**: 32ビット（例: 192.168.1.1）
- **IPv6**: 128ビット
- **プライベートIPアドレス**: 組織内で使用
- **グローバルIPアドレス**: インターネット上で一意

## 代表的なポート番号

| ポート | プロトコル |
|--------|------------|
| 20, 21 | FTP |
| 22 | SSH |
| 25 | SMTP |
| 80 | HTTP |
| 443 | HTTPS |
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: networkArticle.id,
        question: "OSI参照モデルは7層構造である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "OSI参照モデルは物理層、データリンク層、ネットワーク層、トランスポート層、セッション層、プレゼンテーション層、アプリケーション層の7層で構成されます。",
        order: 1,
      },
      {
        articleId: networkArticle.id,
        question: "TCPはコネクションレス型のプロトコルである",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "TCPはコネクション型のプロトコルで、通信前に接続を確立します。UDPがコネクションレス型です。",
        order: 2,
      },
      {
        articleId: networkArticle.id,
        question: "HTTPのデフォルトポート番号は80である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "HTTPのデフォルトポート番号は80です。HTTPSは443です。",
        order: 3,
      },
      {
        articleId: networkArticle.id,
        question: "IPv4アドレスは128ビットで構成される",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "IPv4アドレスは32ビット（例: 192.168.1.1）で構成されます。128ビットはIPv6です。",
        order: 4,
      },
      {
        articleId: networkArticle.id,
        question: "MACアドレスはデータリンク層で使用される",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "MACアドレスはデータリンク層で使用され、同一ネットワーク内の機器を識別します。IPアドレスはネットワーク層で使用されます。",
        order: 5,
      },
    ],
  });

  const securityArticle = await prisma.article.create({
    data: {
      subjectId: itSubject.id,
      title: "情報セキュリティの基礎",
      tags: ["セキュリティ", "暗号", "認証"],
      order: 2,
      bodyMd: `# 情報セキュリティの基礎

情報セキュリティの基本的な概念と対策を学びます。

## 情報セキュリティの3要素（CIA）

1. **機密性（Confidentiality）**: 許可された者だけがアクセス可能
2. **完全性（Integrity）**: 情報が改ざんされていないこと
3. **可用性（Availability）**: 必要な時に利用可能であること

## 暗号化方式

### 共通鍵暗号方式
- 暗号化と復号に同じ鍵を使用
- 処理が高速
- 鍵配送問題がある
- 例: AES, DES

### 公開鍵暗号方式
- 公開鍵と秘密鍵のペアを使用
- 鍵配送問題を解決
- 処理は遅い
- 例: RSA

## 認証方式

1. **知識認証**: パスワードなど
2. **所有物認証**: ICカード、トークンなど
3. **生体認証**: 指紋、顔認証など

## 代表的な攻撃

- **フィッシング**: 偽サイトで情報を詐取
- **SQLインジェクション**: 不正なSQL文を実行
- **DoS/DDoS攻撃**: サービスを妨害
- **ランサムウェア**: 身代金を要求
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: securityArticle.id,
        question: "情報セキュリティの3要素はCIAと呼ばれる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "CIAは機密性（Confidentiality）、完全性（Integrity）、可用性（Availability）の頭文字をとったものです。",
        order: 1,
      },
      {
        articleId: securityArticle.id,
        question: "公開鍵暗号方式は暗号化と復号に同じ鍵を使用する",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "公開鍵暗号方式は公開鍵と秘密鍵のペアを使用します。同じ鍵を使うのは共通鍵暗号方式です。",
        order: 2,
      },
      {
        articleId: securityArticle.id,
        question: "AESは共通鍵暗号方式の代表的なアルゴリズムである",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "AES（Advanced Encryption Standard）は共通鍵暗号方式の代表的なアルゴリズムで、DESの後継として採用されました。",
        order: 3,
      },
      {
        articleId: securityArticle.id,
        question: "SQLインジェクションはデータベースに対する攻撃である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "SQLインジェクションは、入力フォームなどから不正なSQL文を挿入し、データベースを不正操作する攻撃です。",
        order: 4,
      },
      {
        articleId: securityArticle.id,
        question: "生体認証は知識認証の一種である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "認証方式は「知識認証」「所有物認証」「生体認証」の3種類に分類されます。生体認証は独立した認証方式です。",
        order: 5,
      },
    ],
  });

  // 中小企業経営・政策の記事を作成
  const smeSubject = subjects.find((s) => s.name === "中小企業経営・政策")!;

  const smeDefinitionArticle = await prisma.article.create({
    data: {
      subjectId: smeSubject.id,
      title: "中小企業の定義と現状",
      tags: ["中小企業", "定義", "統計"],
      order: 1,
      bodyMd: `# 中小企業の定義と現状

中小企業基本法における定義と日本経済における位置づけを学びます。

## 中小企業の定義（中小企業基本法）

| 業種 | 資本金 | 従業員数 |
|------|--------|----------|
| 製造業・その他 | 3億円以下 | 300人以下 |
| 卸売業 | 1億円以下 | 100人以下 |
| サービス業 | 5千万円以下 | 100人以下 |
| 小売業 | 5千万円以下 | 50人以下 |

※資本金または従業員数のいずれかを満たせば中小企業

## 小規模企業の定義

| 業種 | 従業員数 |
|------|----------|
| 製造業・その他 | 20人以下 |
| 商業・サービス業 | 5人以下 |

## 日本経済における中小企業

- 企業数の約99.7%
- 従業員数の約70%
- 付加価値額の約50%

## 中小企業の強み

1. 意思決定の迅速さ
2. 専門特化
3. 柔軟な顧客対応
4. ニッチ市場での競争力

## 中小企業の課題

1. 経営資源の制約
2. 人材確保・育成
3. 事業承継
4. IT化・デジタル化
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: smeDefinitionArticle.id,
        question: "製造業の中小企業は資本金3億円以下または従業員300人以下である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "製造業・その他の中小企業は、資本金3億円以下または従業員300人以下のいずれかを満たせば中小企業に該当します。",
        order: 1,
      },
      {
        articleId: smeDefinitionArticle.id,
        question: "小売業の中小企業の定義は従業員100人以下である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "小売業の中小企業は資本金5千万円以下または従業員50人以下です。100人以下は卸売業・サービス業の基準です。",
        order: 2,
      },
      {
        articleId: smeDefinitionArticle.id,
        question: "日本の企業数の約99%以上が中小企業である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "日本の企業数の約99.7%が中小企業であり、日本経済の基盤を支えています。",
        order: 3,
      },
      {
        articleId: smeDefinitionArticle.id,
        question: "小規模企業（製造業）の定義は従業員50人以下である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "製造業の小規模企業は従業員20人以下です。商業・サービス業は5人以下です。",
        order: 4,
      },
      {
        articleId: smeDefinitionArticle.id,
        question: "中小企業は日本の従業員数の約70%を占める",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "中小企業は企業数の約99.7%、従業員数の約70%、付加価値額の約50%を占めています。",
        order: 5,
      },
    ],
  });

  const smePolicyArticle = await prisma.article.create({
    data: {
      subjectId: smeSubject.id,
      title: "中小企業支援策",
      tags: ["支援策", "補助金", "融資"],
      order: 2,
      bodyMd: `# 中小企業支援策

中小企業を支援する様々な制度について学びます。

## 金融支援

### 政府系金融機関
- 日本政策金融公庫
- 商工組合中央金庫
- 中小企業基盤整備機構

### 信用保証制度
- 信用保証協会が債務を保証
- 保証割合: 一般保証は80%
- セーフティネット保証（100%保証）

## 税制優遇

- 法人税の軽減税率
- 少額減価償却資産の特例
- 中小企業投資促進税制
- 所得拡大促進税制

## 補助金・助成金

- ものづくり補助金
- IT導入補助金
- 小規模事業者持続化補助金
- 事業再構築補助金

## 経営支援

- 中小企業診断士による支援
- よろず支援拠点
- 商工会・商工会議所
- 事業引継ぎ支援センター

## セーフティネット

- セーフティネット保証（1〜8号）
- 中小企業再生支援
- 私的整理ガイドライン
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: smePolicyArticle.id,
        question: "日本政策金融公庫は政府系金融機関である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "日本政策金融公庫は政府が100%出資する政府系金融機関で、中小企業向けの融資を行っています。",
        order: 1,
      },
      {
        articleId: smePolicyArticle.id,
        question: "信用保証協会の一般保証は100%保証である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "一般保証の保証割合は80%です。100%保証はセーフティネット保証など特別な保証制度で適用されます。",
        order: 2,
      },
      {
        articleId: smePolicyArticle.id,
        question: "ものづくり補助金は中小企業向けの代表的な補助金である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "ものづくり補助金（正式名：ものづくり・商業・サービス生産性向上促進補助金）は中小企業の設備投資等を支援する代表的な補助金です。",
        order: 3,
      },
      {
        articleId: smePolicyArticle.id,
        question: "よろず支援拠点は中小企業の経営相談に対応する公的支援機関である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "よろず支援拠点は中小企業庁が設置した経営相談所で、無料で経営相談に対応しています。",
        order: 4,
      },
      {
        articleId: smePolicyArticle.id,
        question: "事業引継ぎ支援センターは創業支援を行う機関である",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "事業引継ぎ支援センターは事業承継・M&Aを支援する機関です。創業支援は別の機関が行います。",
        order: 5,
      },
    ],
  });

  // 企業経営理論に追加の記事
  const hrArticle = await prisma.article.create({
    data: {
      subjectId: managementSubject.id,
      title: "モチベーション理論",
      tags: ["モチベーション", "マズロー", "ハーズバーグ"],
      order: 2,
      bodyMd: `# モチベーション理論

従業員のモチベーション（動機づけ）に関する主要な理論を学びます。

## マズローの欲求段階説

人間の欲求を5段階に分類：

1. **生理的欲求**: 食事、睡眠など
2. **安全欲求**: 身体的・経済的安全
3. **社会的欲求**: 所属、愛情
4. **承認欲求**: 尊敬、認められたい
5. **自己実現欲求**: 自分の可能性を発揮

※低次の欲求が満たされると高次の欲求が生じる

## ハーズバーグの二要因理論

- **動機づけ要因（満足要因）**: 仕事の達成感、承認、責任など
- **衛生要因（不満足要因）**: 給与、作業条件、人間関係など

※衛生要因を改善しても不満が減るだけで、動機づけには動機づけ要因が必要

## マクレガーのX理論・Y理論

- **X理論**: 人は本来怠惰で、強制・統制が必要
- **Y理論**: 人は本来勤勉で、自発的に働く

## 期待理論（ブルーム）

$$モチベーション = 期待 × 誘意性$$

- 期待: 努力が成果につながる確率
- 誘意性: 成果に対する報酬の魅力度
`,
    },
  });

  await prisma.quiz.createMany({
    data: [
      {
        articleId: hrArticle.id,
        question: "マズローの欲求段階説では、自己実現欲求が最上位である",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "マズローの欲求段階説では、生理的欲求→安全欲求→社会的欲求→承認欲求→自己実現欲求の順に高次になり、自己実現欲求が最上位です。",
        order: 1,
      },
      {
        articleId: hrArticle.id,
        question: "ハーズバーグの二要因理論では、給与は動機づけ要因に分類される",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "給与は衛生要因（不満足要因）に分類されます。動機づけ要因には達成感、承認、責任などが含まれます。",
        order: 2,
      },
      {
        articleId: hrArticle.id,
        question: "マクレガーのY理論は、人は本来勤勉であると考える",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "Y理論は人間を性善説的に捉え、人は本来勤勉で自発的に働くと考えます。X理論は逆に性悪説的です。",
        order: 3,
      },
      {
        articleId: hrArticle.id,
        question: "衛生要因を改善すれば、従業員のモチベーションは高まる",
        quizType: "TRUE_FALSE",
        answer: "false",
        explanation:
          "衛生要因を改善しても不満が減るだけで、モチベーション向上には動機づけ要因（達成感、承認など）が必要です。",
        order: 4,
      },
      {
        articleId: hrArticle.id,
        question: "ブルームの期待理論では、期待と誘意性の積がモチベーションとなる",
        quizType: "TRUE_FALSE",
        answer: "true",
        explanation:
          "期待理論では、努力が成果につながる「期待」と、報酬の魅力度である「誘意性」の積がモチベーションを決定します。",
        order: 5,
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
