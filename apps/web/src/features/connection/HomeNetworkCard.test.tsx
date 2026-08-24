import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeNetworkCard } from "./HomeNetworkCard.js";
import { HOME_COMPUTER_STORAGE_KEY } from "../../utils/homeNetwork.js";

describe("HomeNetworkCard", () => {
  afterEach(() => {
    window.localStorage?.removeItem(HOME_COMPUTER_STORAGE_KEY);
  });
  it("tells a LAN page to install from this origin", () => {
    render(<HomeNetworkCard hostname="192.168.29.44" />);
    expect(screen.getByTestId("lan-install-hint")).toHaveTextContent("Add");
    expect(screen.queryByTestId("home-network-card")).not.toBeInTheDocument();
  });

  it("sends an internet install to the working computer page", async () => {
    const user = userEvent.setup();
    const openHome = vi.fn();
    render(
      <HomeNetworkCard
        hostname="iffalcon-remote.vercel.app"
        cloudBackend
        openHome={openHome}
      />,
    );

    await user.type(screen.getByPlaceholderText("192.168.29.44"), "192.168.29.44");
    await user.click(screen.getByRole("button", { name: "Open on this Wi‑Fi" }));

    expect(openHome).toHaveBeenCalledWith("http://192.168.29.44:5173/");
  });

  it("hides the LAN warning on a home tunnel URL", () => {
    render(<HomeNetworkCard hostname="remote.example.com" cloudBackend={false} />);
    expect(screen.queryByTestId("home-network-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lan-install-hint")).not.toBeInTheDocument();
  });
});
