import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auth, prisma } = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    note: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ prisma }));

import { DELETE, PATCH } from "./route";

const SESSION = { user: { id: "user-1", email: "a@b.com" } };

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/notes/n1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function ctx(id = "n1") {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  auth.mockResolvedValue(SESSION);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/notes/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await PATCH(patchRequest({ content: "hi" }), ctx());

    expect(res.status).toBe(401);
  });

  it("returns 400 when content is blank", async () => {
    const res = await PATCH(patchRequest({ content: "  " }), ctx());

    expect(res.status).toBe(400);
    expect(prisma.note.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the note belongs to another user", async () => {
    prisma.note.findUnique.mockResolvedValue({
      id: "n1",
      userId: "someone-else",
    });

    const res = await PATCH(patchRequest({ content: "hi" }), ctx());

    expect(res.status).toBe(404);
    expect(prisma.note.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the note does not exist", async () => {
    prisma.note.findUnique.mockResolvedValue(null);

    const res = await PATCH(patchRequest({ content: "hi" }), ctx());

    expect(res.status).toBe(404);
  });

  it("updates an owned note with trimmed content", async () => {
    prisma.note.findUnique.mockResolvedValue({ id: "n1", userId: "user-1" });
    const updated = { id: "n1", content: "new", userId: "user-1" };
    prisma.note.update.mockResolvedValue(updated);

    const res = await PATCH(patchRequest({ content: "  new  " }), ctx());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(updated);
    expect(prisma.note.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { content: "new" },
    });
  });
});

describe("DELETE /api/notes/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await DELETE(
      new Request("http://localhost/api/notes/n1"),
      ctx(),
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when the note belongs to another user", async () => {
    prisma.note.findUnique.mockResolvedValue({
      id: "n1",
      userId: "someone-else",
    });

    const res = await DELETE(
      new Request("http://localhost/api/notes/n1"),
      ctx(),
    );

    expect(res.status).toBe(404);
    expect(prisma.note.delete).not.toHaveBeenCalled();
  });

  it("deletes an owned note and returns 204", async () => {
    prisma.note.findUnique.mockResolvedValue({ id: "n1", userId: "user-1" });
    prisma.note.delete.mockResolvedValue({});

    const res = await DELETE(
      new Request("http://localhost/api/notes/n1"),
      ctx(),
    );

    expect(res.status).toBe(204);
    expect(prisma.note.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });
});
