import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideLauncher } from "@/features/guides/components/guide-launcher";
import { GuideProvider } from "@/features/guides/components/guide-provider";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useGuideStore } from "@/features/guides/stores/guide-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("GuideProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "owner@example.com",
        fullName: "Owner",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      organization: {
        id: "org-1",
        name: "Org",
        slug: "org",
        createdAt: new Date().toISOString(),
      },
    });
    useGuideStore.setState({ completed: {}, progress: {} });
  });

  afterEach(() => vi.useRealTimers());

  it("auto-runs once and can be restarted from Help", async () => {
    render(
      <GuideProvider>
        <main data-guide="module-root">Dashboard</main>
        <GuideLauncher />
      </GuideProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useGuideStore.getState().completed["user-1:org-1:dashboard"]).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Open module guide" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
