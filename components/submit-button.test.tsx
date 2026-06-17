import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmitButton } from "./submit-button";

function renderInForm(action: () => Promise<void>) {
  return render(
    <form action={action}>
      <SubmitButton pendingText="Working..." className="btn">
        Submit
      </SubmitButton>
    </form>,
  );
}

afterEach(() => {
  cleanup();
});

describe("SubmitButton", () => {
  it("renders children and is enabled before submission", () => {
    renderInForm(async () => {});

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toBeEnabled();
  });

  it("shows the pending text and disables the button while the action runs", async () => {
    const user = userEvent.setup();
    let resolveAction: () => void = () => {};
    renderInForm(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Working...",
    });
    expect(pendingButton).toBeDisabled();

    resolveAction();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled(),
    );
  });
});
