import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, identity } from "../src/lib/domain";

const mocks = vi.hoisted(() => ({
  accessible: vi.fn(),
  remove: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  actor: (req: Request) => identity(req.headers.get("x-demo-user")),
  accessible: mocks.accessible,
  failure: (error: unknown) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: error instanceof AppError ? error.status : 500 },
    ),
}));
import { DELETE } from "../src/app/api/documents/[id]/route";

const id = "00000000-0000-4000-8000-000000000123";
const context = () => ({ params: Promise.resolve({ id }) });
const request = (user?: string) =>
  new Request(`https://example.test/api/documents/${id}`, {
    method: "DELETE",
    headers: user ? { "x-demo-user": user } : {},
  });

describe("DELETE document route (mock database only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mutation = {
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
      select: vi.fn().mockReturnThis(),
    };
    mocks.eq.mockReturnValue(mutation);
    mocks.remove.mockReturnValue(mutation);
    mocks.maybeSingle.mockResolvedValue({ data: { id }, error: null });
    mocks.accessible.mockResolvedValue({
      document: { id, owner_id: "alice" },
      client: { from: vi.fn().mockReturnValue({ delete: mocks.remove }) },
    });
  });
  it("allows the owner and scopes the database mutation by both ID and owner", async () => {
    const response = await DELETE(request("alice"), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true, id });
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(mocks.eq.mock.calls).toEqual([
      ["id", id],
      ["owner_id", "alice"],
    ]);
  });
  it("rejects shared editors without invoking delete", async () => {
    const response = await DELETE(request("bob"), context());
    expect(response.status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects unknown or missing identities before accessing data", async () => {
    expect((await DELETE(request(), context())).status).toBe(401);
    expect((await DELETE(request("mallory"), context())).status).toBe(401);
    expect(mocks.accessible).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("preserves access denial for users with no share", async () => {
    mocks.accessible.mockRejectedValue(new AppError("No access", 403));
    expect((await DELETE(request("bob"), context())).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("reports missing or concurrently deleted documents", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await DELETE(request("alice"), context())).status).toBe(404);
  });
  it("reports database failures instead of claiming success", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: new Error("Database unavailable"),
    });
    expect((await DELETE(request("alice"), context())).status).toBe(500);
  });
});
