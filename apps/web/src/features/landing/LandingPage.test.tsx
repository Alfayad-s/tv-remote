import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "./LandingPage.js";

describe("LandingPage", () => {
  it("offers the Android app download and lists app features", async () => {
    const user = userEvent.setup();
    const onGo = vi.fn();
    render(<LandingPage onGo={onGo} />);

    expect(screen.getByRole("button", { name: "Download app" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: /TV\s+Remote/i })).toBeInTheDocument();
    expect(screen.queryByText(/iFFALCON/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No laptop needed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open web remote" })).not.toBeInTheDocument();
    expect(screen.getByText("Touchpad")).toBeInTheDocument();
    expect(screen.getByText("Volume strip")).toBeInTheDocument();
    expect(screen.getByText("Alfayad")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "alfayad.vercel.app" })).toHaveAttribute(
      "href",
      "https://alfayad.vercel.app",
    );

    await user.click(screen.getAllByRole("button", { name: "Contact" })[0]);
    expect(onGo).toHaveBeenCalledWith("/contact");
  });
});
