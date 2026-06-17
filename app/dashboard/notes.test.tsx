import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/test/utils";
import { Notes } from "./notes";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

function note(overrides: Partial<Note> = {}): Note {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "n1",
    content: "first note",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("Notes", () => {
  it("renders notes returned from the API", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([note({ content: "hello world" })]),
    );

    renderWithClient(<Notes />);

    expect(await screen.findByText("hello world")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/notes");
  });

  it("shows the empty state when there are no notes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    renderWithClient(<Notes />);

    expect(
      await screen.findByText("No notes yet. Write one above."),
    ).toBeInTheDocument();
  });

  it("creates a note and prepends it to the list", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([note({ id: "old", content: "old note" })]),
      )
      .mockResolvedValueOnce(
        jsonResponse(note({ id: "new", content: "brand new" }), {
          status: 201,
        }),
      );

    renderWithClient(<Notes />);
    await screen.findByText("old note");

    await user.type(
      screen.getByPlaceholderText("Write a note..."),
      "brand new",
    );
    await user.click(screen.getByRole("button", { name: "Add note" }));

    expect(await screen.findByText("brand new")).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find(
      ([, opts]) => opts?.method === "POST",
    );
    expect(postCall?.[0]).toBe("/api/notes");
    expect(JSON.parse((postCall?.[1] as RequestInit).body as string)).toEqual({
      content: "brand new",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("edits a note in place", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([note({ id: "n1", content: "before" })]),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          note({
            id: "n1",
            content: "after",
            updatedAt: "2026-02-02T00:00:00.000Z",
          }),
        ),
      );

    renderWithClient(<Notes />);
    await screen.findByText("before");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("before");
    await user.clear(textarea);
    await user.type(textarea, "after");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("after")).toBeInTheDocument();
    expect(screen.queryByText("before")).not.toBeInTheDocument();

    const patchCall = fetchMock.mock.calls.find(
      ([, opts]) => opts?.method === "PATCH",
    );
    expect(patchCall?.[0]).toBe("/api/notes/n1");
  });

  it("optimistically removes a note on delete", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        note({ id: "keep", content: "keep me" }),
        note({ id: "drop", content: "delete me" }),
      ]),
    );

    let resolveDelete: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveDelete = resolve;
      }),
    );

    renderWithClient(<Notes />);
    await screen.findByText("delete me");

    const deleteRow = screen.getByText("delete me").closest("li")!;
    await user.click(within(deleteRow).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.queryByText("delete me")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("keep me")).toBeInTheDocument();

    resolveDelete(new Response(null, { status: 204 }));
  });
});
