import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "./LandingPage.js";

describe("LandingPage", () => {
  it("offers the Android app download and opens the web remote", async () => {
    const user = userEvent.setup();
    const onOpenRemote = vi.fn();
    render(<LandingPage onOpenRemote={onOpenRemote} />);

    const download = screen.getByRole("button", { name: "Download app" });
    expect(download).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Open web remote" }));
    expect(onOpenRemote).toHaveBeenCalledTimes(1);
  });
});
