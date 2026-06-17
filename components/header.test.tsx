import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth, signOut: vi.fn() }));

import { Header } from "./header";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Header", () => {
  it("shows sign in and register links when logged out", async () => {
    auth.mockResolvedValue(null);

    render(await Header());

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("shows dashboard, name, and sign out when logged in with a name", async () => {
    auth.mockResolvedValue({
      user: { id: "u1", email: "a@b.com", name: "Argen" },
    });

    render(await Header());

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Argen" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
  });

  it("falls back to email when the user has no name", async () => {
    auth.mockResolvedValue({
      user: { id: "u1", email: "a@b.com", name: null },
    });

    render(await Header());

    expect(screen.getByRole("link", { name: "a@b.com" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("always shows a Home link", async () => {
    auth.mockResolvedValue(null);

    render(await Header());

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
