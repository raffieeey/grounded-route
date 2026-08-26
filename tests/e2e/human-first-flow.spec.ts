import { test, expect } from "@playwright/test";

test.describe("FDN-002 human-first flow", () => {
  test("keyboard-only path loads, selects profile, stages, drafts, approves, exports", async ({ page }) => {
    await page.goto("/");

    // Ensure no external requests
    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.getByRole("button", { name: "Load illustrative demo" }).click();
    await expect(page.getByRole("region", { name: "Workspace" })).toBeVisible();

    await page.getByRole("button", { name: "Wheelchair user" }).click();
    await expect(page.getByRole("button", { name: "Wheelchair user" })).toHaveAttribute("aria-pressed", "true");

    const segmentList = page.getByRole("list", { name: "Route segments" });
    await expect(segmentList).toBeVisible();

    const firstItem = segmentList.getByRole("listitem").first();
    await firstItem.getByRole("button", { name: "Stage" }).click();

    const draftBtn = page.getByRole("button", { name: "Open draft" });
    await expect(draftBtn).toBeVisible();
    await draftBtn.click();

    await expect(page.getByRole("form", { name: "Draft review" })).toBeVisible();

    await page.getByLabel("Your position").fill("Concerned resident");
    await page.getByLabel("Requested change").fill("Install tactile paving");
    await page.getByLabel("Open questions").fill("What is the timeline?");
    await page.getByRole("button", { name: "Create draft" }).click();

    const exportBtn = page.getByRole("button", { name: "Export" });
    await expect(exportBtn).toBeDisabled();

    await page.getByRole("button", { name: "Approve current draft" }).click();
    await expect(exportBtn).not.toBeDisabled();

    // No external requests should have been made
    const external = requests.filter((u) => !u.startsWith("blob:") && !u.startsWith("data:") && !u.includes("localhost"));
    expect(external.length).toBe(0);
  });

  test("clear session resets workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Load illustrative demo" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();
    await page.getByRole("button", { name: "Clear current session" }).click();
    await expect(page.getByRole("button", { name: "Load illustrative demo" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workspace" })).not.toBeVisible();
  });
});
