import { expect, test } from "@playwright/test";

test("new user completes trial and business onboarding", async ({ page }) => {
  const now = new Date().toISOString();
  const user = {
    id: "user-1",
    email: "owner@example.com",
    fullName: "Owner",
    first_name: "Owner",
    created_at: now,
    updated_at: now,
  };
  const organization = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Owner's Workspace",
    slug: "owner-workspace",
    created_at: now,
    updated_at: now,
    business_context: {},
  };
  let stage: "trial" | "profile" | "dashboard" = "trial";

  await page.addInitScript(
    ({ user, organization }) => {
      localStorage.setItem(
        "novixa-auth-v2",
        JSON.stringify({
          state: {
            user,
            organization,
            accessToken: "test-access",
            refreshToken: "test-refresh",
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "novixa-active-org",
        JSON.stringify({ state: { activeOrganizationId: organization.id }, version: 0 }),
      );
    },
    { user, organization },
  );

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith("/auth/me/")) {
      await route.fulfill({ json: user });
    } else if (path.endsWith("/organizations/bootstrap/")) {
      await route.fulfill({
        json: {
          organization,
          subscription_status: stage === "trial" ? "none" : "trialing",
          trial_end: stage === "trial" ? null : new Date(Date.now() + 86400000 * 15).toISOString(),
          payment_method_ready: stage !== "trial",
          entitlement_active: stage !== "trial",
          profile_complete: stage === "dashboard",
          next_step: stage,
        },
      });
    } else if (path.endsWith("/billing/plans/")) {
      await route.fulfill({
        json: [
          {
            code: "starter",
            name: "Starter",
            description: "For small teams",
            amount_cents: 4900,
            currency: "USD",
            features: ["AI tools"],
          },
        ],
      });
    } else if (path.endsWith("/billing/checkout/")) {
      stage = "profile";
      await route.fulfill({
        status: 201,
        json: {
          checkout_url: `/billing/checkout/stub-session?plan=starter&org=${organization.id}`,
        },
      });
    } else if (path.endsWith("/billing/attach-card/")) {
      await route.fulfill({
        json: {
          id: "sub-1",
          plan_code: "starter",
          status: "trialing",
          payment_method: "card",
          auto_charge: true,
        },
      });
    } else if (/\/organizations\/[^/]+\/complete-onboarding\/$/.test(path)) {
      stage = "dashboard";
      await route.fulfill({
        json: {
          organization: { ...organization, onboarding_completed: true },
          profile_complete: true,
          next_step: "dashboard",
        },
      });
    } else if (/\/organizations\/[^/]+\/$/.test(path) && route.request().method() === "PATCH") {
      await route.fulfill({
        json: { ...organization, logo_url: "/media/org_logos/logo.png" },
      });
    } else if (path.endsWith("/organizations/")) {
      await route.fulfill({ json: [organization] });
    } else {
      await route.fulfill({ json: {} });
    }
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding\?step=trial/);
  await page.getByRole("button", { name: "Start free trial" }).click();
  await expect(page).toHaveURL(/\/billing\/checkout\/stub-session/);
  await expect(page).toHaveURL(/\/onboarding\?step=profile/, { timeout: 5000 });

  await page.getByLabel("Organization name *").fill("Acme Automation");
  await page.getByLabel("Industry *").fill("Technology");
  await page.getByLabel("About the business *").fill("Automation systems for growing teams.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Finish setup and open dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
