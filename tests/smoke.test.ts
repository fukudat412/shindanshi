import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("smoke", () => {
  it("cn がクラス名を結合し、Tailwind の衝突は後勝ちにする", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })
})
