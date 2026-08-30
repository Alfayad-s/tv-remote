import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage.js";

describe("LandingPage", () => {
  it("offers the Android app download and not a web remote", () => {
    render(<LandingPage />);

    expect(screen.getByRole("button", { name: "Download app" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: /TV\s+Remote/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open web remote" })).not.toBeInTheDocument();
    expect(screen.queryByText(/open the web remote/i)).not.toBeInTheDocument();
  });
});
