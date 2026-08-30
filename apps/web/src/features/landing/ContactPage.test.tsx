import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactPage } from "./ContactPage.js";

describe("ContactPage", () => {
  it("credits Alfayad as author and builder", () => {
    render(<ContactPage onGo={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Author" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alfayad" })).toBeInTheDocument();
    expect(screen.getByText(/Author of this app/i)).toBeInTheDocument();
    expect(screen.getAllByText(/built by Alfayad/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "alfayad.vercel.app" })).toHaveAttribute(
      "href",
      "https://alfayad.vercel.app",
    );
  });
});
