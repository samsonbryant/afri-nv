import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page renders Novixa brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Novixa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start free" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("register page is reachable", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });
});
