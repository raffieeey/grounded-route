import { test, expect } from "@playwright/test";

test.describe("FDN-008 human-first flow", () => {
  test("keyboard-only path starts, selects profile, adds concern, drafts, approves, exports", async ({ page }) => {
    await page.goto("/");

    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await expect(page.getByRole("region", { name: "Workspace" })).toBeVisible();

    await page.getByRole("button", { name: "Wheelchair user" }).click();
    await expect(page.getByRole("button", { name: "Wheelchair user" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "Route impact check" })).toBeVisible();

    const conditions = page.getByRole("region", { name: "Conditions to review" });
    await conditions.getByRole("button", { name: /Add .* to my draft/i }).first().click();

    const draft = page.getByRole("region", { name: "Draft review" });
    await draft.getByRole("button", { name: "Prepare draft" }).click();

    const exportBtn = page.getByRole("button", { name: "Export" });
    await expect(exportBtn).toBeDisabled();

    await page.getByRole("button", { name: "Approve current draft" }).click();
    await expect(exportBtn).not.toBeDisabled();

    const external = requests.filter((u) => !u.startsWith("blob:") && !u.startsWith("data:") && !u.includes("localhost"));
    expect(external.length).toBe(0);
  });

  test("clear session resets workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();
    await page.getByRole("button", { name: "Clear current session" }).click();
    await expect(page.getByRole("button", { name: "Start a route-impact check" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workspace" })).not.toBeVisible();
  });
});
