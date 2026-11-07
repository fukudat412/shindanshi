// 検証済みでない問題の解説に添える注意書き
export function UnverifiedExplanationNote() {
  return (
    <p className="text-xs text-muted-foreground">
      この解説は AI が作成したもので、まだ確認していません。誤りがあるかもしれません。
    </p>
  );
}
