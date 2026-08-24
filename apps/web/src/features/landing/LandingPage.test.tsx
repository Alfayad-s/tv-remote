import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ANDROID_APK_HREF } from "../../utils/androidApk.js";
import { LandingPage } from "./LandingPage.js";

describe("LandingPage", () => {
  it("offers the Android app download and opens the web remote", async () => {
    const user = userEvent.setup();
    const onOpenRemote = vi.fn();
    render(<LandingPage onOpenRemote={onOpenRemote} />);

    const download = screen.getByRole("link", { name: "Download app" });
    expect(download).toHaveAttribute("href", ANDROID_APK_HREF);
    expect(download).toHaveAttribute("download");

    await user.click(screen.getByRole("button", { name: "Open web remote" }));
    expect(onOpenRemote).toHaveBeenCalledTimes(1);
  });
});
