import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { quizImage: { findUnique: m.findUnique } } }));

import { GET } from "@/app/api/quiz-images/[id]/route";

const get = (id: string) => GET(new Request(`http://localhost/api/quiz-images/${id}`), {
  params: Promise.resolve({ id }),
});

beforeEach(() => vi.clearAllMocks());

describe("GET /api/quiz-images/[id]", () => {
  it("図があれば PNG として返し、長くキャッシュさせる", async () => {
    m.findUnique.mockResolvedValue({ data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) });
    const res = await get("img1");
    expect(m.findUnique).toHaveBeenCalledWith({ where: { id: "img1" }, select: { data: true } });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
  });

  it("なければ 404", async () => {
    m.findUnique.mockResolvedValue(null);
    expect((await get("nope")).status).toBe(404);
  });
});
