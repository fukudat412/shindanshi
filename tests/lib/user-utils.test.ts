import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (a: unknown) => findUnique(a), create: (a: unknown) => create(a) } },
}));

import { getCurrentUserId } from "@/lib/user-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUserId", () => {
  it("T-005 AC1 セッションにユーザー id があればそれを返す", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    expect(await getCurrentUserId()).toBe("user-1");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("T-005 AC1 セッションがなければ既存のゲストユーザーの id を返す", async () => {
    authMock.mockResolvedValue(null);
    findUnique.mockResolvedValue({ id: "guest-1" });
    expect(await getCurrentUserId()).toBe("guest-1");
    expect(create).not.toHaveBeenCalled();
  });

  it("T-005 AC1 ゲストユーザーがいなければ作成してその id を返す", async () => {
    authMock.mockResolvedValue({ user: {} });
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "guest-2" });
    expect(await getCurrentUserId()).toBe("guest-2");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
