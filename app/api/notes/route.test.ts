import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auth, prisma } = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    note: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ prisma }));

import { GET, POST } from "./route";

const SESSION = { user: { id: "user-1", email: "a@b.com" } };

function postRequest(body: unknown) {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  auth.mockResolvedValue(SESSION);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(prisma.note.findMany).not.toHaveBeenCalled();
  });

  it("returns the current user's notes, newest first", async () => {
    const notes = [{ id: "n1", content: "hi", userId: "user-1" }];
    prisma.note.findMany.mockResolvedValue(notes);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(notes);
    expect(prisma.note.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await POST(postRequest({ content: "hi" }));

    expect(res.status).toBe(401);
    expect(prisma.note.create).not.toHaveBeenCalled();
  });

  it("returns 400 when content is blank", async () => {
    const res = await POST(postRequest({ content: "   " }));

    expect(res.status).toBe(400);
    expect(prisma.note.create).not.toHaveBeenCalled();
  });

  it("creates a trimmed note for the current user", async () => {
    const created = { id: "n2", content: "hello", userId: "user-1" };
    prisma.note.create.mockResolvedValue(created);

    const res = await POST(postRequest({ content: "  hello  " }));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual(created);
    expect(prisma.note.create).toHaveBeenCalledWith({
      data: { content: "hello", userId: "user-1" },
    });
  });
});
