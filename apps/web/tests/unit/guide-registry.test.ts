import { describe, expect, it } from "vitest";
import { GUIDE_REGISTRY, findGuide } from "@/features/guides/guide-registry";

describe("guide registry", () => {
  it("covers every primary dashboard module", () => {
    const routes = [
      "/dashboard",
      "/assistant",
      "/workflows",
      "/automations",
      "/knowledge",
      "/crm",
      "/support",
      "/marketing",
      "/documents",
      "/reports",
      "/meetings",
      "/agents",
      "/billing",
      "/analytics",
      "/security",
      "/developer",
      "/settings",
      "/admin",
    ];
    for (const route of routes) {
      expect(findGuide(route), route).not.toBeNull();
    }
    expect(GUIDE_REGISTRY.every((guide) => guide.steps.length >= 3)).toBe(true);
  });

  it("matches dynamic workflow builders", () => {
    expect(findGuide("/workflows/123/builder")?.id).toBe("workflow-builder");
  });
});
