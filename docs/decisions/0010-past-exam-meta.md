# 0010 過去問の出自・年度・問番号を Quiz に持たせる

- Quiz に origin（既定 SIMILAR）・examYear（西暦）・examQuestionNumber・examSubQuestionNumber を追加。1次試験は「第N問 設問M」があり、問番号だけでは1問を特定できないため。
- 表示書式と検証は純粋関数として `src/lib/past-exam.ts` に置く（T-014〜T-016 で使う）。年度が令和元年（2019）以降かどうかで和暦を切り替える。
