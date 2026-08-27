import { test, expect } from "@playwright/test";

const SIX_TOOLS = [
  "clear_staged_overlay",
  "draft_public_comment",
  "find_plan_evidence",
  "get_review_status",
  "get_route_context",
  "stage_impact_overlay",
];

test.describe("FDN-008 route-verdict browser contract", () => {
  test("V1: first screen shows resident-facing value prop and route-impact-check CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Start a route-impact check" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(/fixture|illustrative demo/i);
    await expect(page.getByText(/illustrative|not navigation|not a verified/i).first()).toBeVisible();
  });

  test("V4: full verdict card and resident action fit within 390x844 for every profile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const profiles = ["Wheelchair user", "School-pickup parent", "Cyclist"];

    for (const profileButton of profiles) {
      await page.goto("/");
      await page.getByRole("button", { name: "Start a route-impact check" }).click();
      await page.getByRole("button", { name: profileButton }).click();

      const verdict = page.getByRole("region", { name: "Route impact check" });
      await expect(verdict).toBeVisible();

      // No scroll: the verdict must fit on the first screen on its own.
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      const cardBox = await verdict.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(844);

      // A real, keyboard-accessible resident action is fully visible inside the card.
      const action = verdict.getByRole("button", { name: /Review .* condition/i });
      await expect(action).toBeVisible();
      await expect(action).toBeEnabled();
      const actionBox = await action.boundingBox();
      expect(actionBox).not.toBeNull();
      expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(844);

      // Exhaustive evidence is not rendered until disclosure.
      await expect(page.getByRole("region", { name: "Evidence board" })).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Audit trail" })).toHaveCount(0);
    }

    // The visible action starts the next resident step: it focuses the
    // conditions shortlist so the resident can act without guessing.
    await page.goto("/");
    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();
    const verdict = page.getByRole("region", { name: "Route impact check" });
    const action = verdict.getByRole("button", { name: /Review .* condition/i });
    const shortlist = page.getByRole("region", { name: "Conditions to review" });
    await action.click();
    await expect(shortlist).toBeFocused();
  });

  test("V2/V3: profile selection changes the verdict and conditions deterministically", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start a route-impact check" }).click();

    await page.getByRole("button", { name: "Wheelchair user" }).click();
    const verdict = page.getByRole("region", { name: "Route impact check" });
    await expect(verdict).toBeVisible();
    await expect(page.getByTestId("profile-route-caption")).toContainText("Your route as a Wheelchair user — avoids steps");
    const wheelchairHeadline = await verdict.locator(".verdict-headline").textContent();
    const wheelchairConditions = await page
      .getByRole("region", { name: "Conditions to review" })
      .getByRole("article")
      .count();

    await page.getByRole("button", { name: "Cyclist" }).click();
    await expect(page.getByTestId("profile-route-caption")).toContainText("Your route as a Cyclist — uses road bypass");
    const cyclistHeadline = await verdict.locator(".verdict-headline").textContent();
    const cyclistConditions = await page
      .getByRole("region", { name: "Conditions to review" })
      .getByRole("article")
      .count();

    expect(wheelchairHeadline).not.toBe(cyclistHeadline);
    expect(wheelchairConditions).not.toBe(cyclistConditions);
    expect(wheelchairConditions).toBeGreaterThan(0);
    expect(cyclistConditions).toBeGreaterThan(0);
    // Resident-facing verdict does not expose raw mapping IDs.
    expect(wheelchairHeadline).not.toMatch(/map-\d/);
  });

  test("V5: plain concern action prefills an editable draft; approval/export stay resident-only", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();

    const conditions = page.getByRole("region", { name: "Conditions to review" });
    await conditions.getByRole("button", { name: /Add .* to my draft/i }).first().click();
    await expect(page.getByRole("button", { name: /remove .* from draft/i })).toBeVisible();

    const draft = page.getByRole("region", { name: "Draft review" });
    await expect(draft.getByLabel("Your position")).not.toHaveValue("");
    await draft.getByLabel("Your position").fill("My edited resident position");
    await draft.getByRole("button", { name: "Prepare draft" }).click();

    const exportBtn = page.getByRole("button", { name: "Export" });
    await expect(exportBtn).toBeDisabled();
    await page.getByRole("button", { name: "Approve current draft" }).click();
    await expect(exportBtn).not.toBeDisabled();
  });

  test("V6: WebMCP agent mutation produces a visible assistant activity summary; six raw tools register", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __tools: unknown[] }).__tools = [];
      (document as unknown as { modelContext: unknown }).modelContext = {
        registerTool: async (tool: unknown) => {
          (window as unknown as { __tools: unknown[] }).__tools.push(tool);
          return { registeredTool: tool };
        },
      };
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // Six raw tools register, with no human-authority capability.
    await expect.poll(async () => {
      return await page.evaluate(() => (window as unknown as { __tools: { name: string }[] }).__tools.length);
    }).toBe(6);
    const names = await page.evaluate(() =>
      (window as unknown as { __tools: { name: string }[] }).__tools.map((t) => t.name).sort()
    );
    expect(names).toEqual([...SIX_TOOLS].sort());
    for (const n of names) {
      expect(n).not.toMatch(/approve|export|publish|copy|download|chat/i);
    }

    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();

    const staged = await page.evaluate(async () => {
      const w = window as unknown as { __tools: { name: string; execute: (i: Record<string, unknown>) => Promise<string> }[] };
      const ctxTool = w.__tools.find((t) => t.name === "get_route_context")!;
      const ctxOut = JSON.parse(await ctxTool.execute({})) as { data: { revision: number } };
      const rev = ctxOut.data.revision;
      const stageTool = w.__tools.find((t) => t.name === "stage_impact_overlay")!;
      const out = JSON.parse(await stageTool.execute({ mappingId: "map-01", expectedRevision: rev }));
      return out;
    });
    expect(staged.success).toBe(true);

    const activity = page.getByRole("region", { name: "Assistant activity" });
    await expect(activity).toBeVisible();
    await expect(activity).toContainText(/staged a possible plan impact/i);
    await expect(activity).not.toContainText(/revisionBefore|evt-\d/);

    // The agent's work is visible on the 390px first screen without a scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const activityBox = await activity.boundingBox();
    expect(activityBox).not.toBeNull();
    expect(activityBox!.y + activityBox!.height).toBeLessThanOrEqual(844);
    await expect(page.getByText(/With the staged plan overlay/i)).toBeVisible();
  });

  test("V6: absent modelContext human flow shows no assistant activity", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start a route-impact check" }).click();
    await page.getByRole("button", { name: "Wheelchair user" }).click();
    await expect(page.getByRole("region", { name: "Route impact check" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Assistant activity" })).toHaveCount(0);
  });
});

test.describe("FDN-008-V5-01 prefilled draft fields are fully readable at 390x844", () => {
  const PROFILES = ["Wheelchair user", "School-pickup parent", "Cyclist"] as const;

  for (const profileButton of PROFILES) {
    test(`V5-01 (${profileButton}): every prefilled draft field fits without internal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.getByRole("button", { name: "Start a route-impact check" }).click();
      await page.getByRole("button", { name: profileButton }).click();

      // Review conditions and add a concern, per the reproduced resident flow.
      const conditions = page.getByRole("region", { name: "Conditions to review" });
      await conditions.getByRole("button", { name: /Add .* to my draft/i }).first().click();

      const draft = page.getByRole("region", { name: "Draft review" });

      const measure = async (label: string) => {
        const field = draft.getByLabel(label);
        await expect(field).not.toHaveValue("");
        return field.evaluate((el) => {
          const input = el as HTMLTextAreaElement;
          return {
            valueLen: (input.value ?? "").length,
            clientHeight: input.clientHeight,
            scrollHeight: input.scrollHeight,
            clientWidth: input.clientWidth,
            scrollWidth: input.scrollWidth,
          };
        });
      };

      for (const label of ["Your position", "Requested change", "Open questions"]) {
        const dims = await measure(label);
        expect(dims.valueLen, `${label} prefill must be non-empty`).toBeGreaterThan(0);
        expect(
          dims.scrollHeight,
          `${label} must not scroll vertically: scrollHeight=${dims.scrollHeight} clientHeight=${dims.clientHeight}`,
        ).toBeLessThanOrEqual(dims.clientHeight);
        expect(
          dims.scrollWidth,
          `${label} must not scroll horizontally: scrollWidth=${dims.scrollWidth} clientWidth=${dims.clientWidth}`,
        ).toBeLessThanOrEqual(dims.clientWidth);
      }

      // Editability, keyboard use, and resident-only approval/export remain intact.
      const position = draft.getByLabel("Your position");
      await position.fill("Edited resident position");
      await expect(position).toHaveValue("Edited resident position");
      await draft.getByRole("button", { name: "Prepare draft" }).click();
      const exportBtn = page.getByRole("button", { name: "Export" });
      await expect(exportBtn).toBeDisabled();
      await page.getByRole("button", { name: "Approve current draft" }).click();
      await expect(exportBtn).not.toBeDisabled();
    });
  }
});
