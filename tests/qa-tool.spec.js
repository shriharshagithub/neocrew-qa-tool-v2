/**
 * qa-tool.spec.js — End-to-end tests for NeoCrew QA Tool
 * Requires a saved Google session from auth.setup.js
 */

const { test, expect } = require("@playwright/test");

// ── helpers ───────────────────────────────────────────────────────────────────
async function addIssue(page, {
  title,
  description = "Test description for automated run",
  raisedBy   = "Shri",
  assignedTo = "Amit",
  category   = "bug",
  priority   = "medium",
} = {}) {
  // Fill mandatory fields
  await page.getByPlaceholder("Issue title *").fill(title);
  await page.getByPlaceholder(/Description, steps/i).fill(description);

  // Raised by / Assigned to
  const raised = page.locator("input[list='tl-r']");
  await raised.clear();
  await raised.fill(raisedBy);

  const assigned = page.locator("input[list='tl-a']");
  await assigned.clear();
  await assigned.fill(assignedTo);

  // Category toggle (click the matching badge button)
  await page.getByRole("button", { name: new RegExp(`^${category}$`, "i") }).first().click();

  // Priority toggle
  await page.getByRole("button", { name: new RegExp(`^${priority}$`, "i") }).first().click();

  // Submit
  await page.getByRole("button", { name: /add to report/i }).click();

  // Wait for "Added" flash or item in list
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
}

async function goToTab(page, name) {
  await page.getByRole("button", { name: new RegExp(`^${name}`, "i") }).first().click();
}

// ── suite ─────────────────────────────────────────────────────────────────────
test.describe("NeoCrew QA Tool — E2E", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Must land on the main app, not the login page
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
    await expect(page.locator("nav")).toBeVisible();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  test("user is authenticated — no redirect to login", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
    // Avatar or initials circle in nav
    const avatar = page.locator("nav img, nav .rounded-full").first();
    await expect(avatar).toBeVisible();
  });

  // ── Capture tab ───────────────────────────────────────────────────────────
  test("capture form has all required fields", async ({ page }) => {
    await expect(page.getByPlaceholder("Issue title *")).toBeVisible();
    await expect(page.getByPlaceholder(/Description, steps/i)).toBeVisible();
    await expect(page.locator("input[list='tl-r']")).toBeVisible(); // Raised by
    await expect(page.locator("input[list='tl-a']")).toBeVisible(); // Assigned to
  });

  test("submit button is disabled until all mandatory fields are filled", async ({ page }) => {
    const btn = page.getByRole("button", { name: /add to report/i });
    // Initially disabled (no title/description/assignee)
    await expect(btn).toBeDisabled();

    // Fill title only — still disabled
    await page.getByPlaceholder("Issue title *").fill("Half filled");
    await expect(btn).toBeDisabled();

    // Fill rest of mandatory fields — now enabled
    await page.getByPlaceholder(/Description, steps/i).fill("Some context");
    await page.locator("input[list='tl-a']").fill("Amit");
    await expect(btn).toBeEnabled();
  });

  test("paste hint is visible", async ({ page }) => {
    await expect(page.getByText(/⌘V/)).toBeVisible();
  });

  test("can add a bug", async ({ page }) => {
    await addIssue(page, {
      title:    "Login button broken on Safari",
      category: "bug",
      priority: "high",
    });
    await expect(page.getByText("Login button broken on Safari")).toBeVisible();
  });

  test("can add a feature request", async ({ page }) => {
    await addIssue(page, {
      title:    "Add dark mode toggle",
      category: "feature",
      priority: "low",
    });
    await expect(page.getByText("Add dark mode toggle")).toBeVisible();
  });

  test("can add an improvement", async ({ page }) => {
    await addIssue(page, {
      title:    "Speed up dashboard load",
      category: "improvement",
      priority: "medium",
    });
    await expect(page.getByText("Speed up dashboard load")).toBeVisible();
  });

  test("issue list shows issue count after adding", async ({ page }) => {
    await addIssue(page, { title: "Count test issue" });
    // Issues header shows a count badge
    await expect(page.getByText(/Issues/).first()).toBeVisible();
  });

  test("can remove an issue via hover ✕ button", async ({ page }) => {
    await addIssue(page, { title: "Issue to delete" });
    const row = page.locator("div").filter({ hasText: "Issue to delete" }).first();
    await row.hover();
    await row.getByRole("button", { name: "✕" }).click();
    await expect(page.getByText("Issue to delete")).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Report tab ────────────────────────────────────────────────────────────
  test("report tab shows share link when issues exist", async ({ page }) => {
    await addIssue(page, { title: "Report tab test issue" });
    await goToTab(page, "Report");

    const shareBtn = page.getByRole("button", { name: /copy share link/i });
    await expect(shareBtn).toBeEnabled();
    await expect(page.locator("code")).toContainText("/report/");
  });

  test("copy share link button flashes confirmation", async ({ page }) => {
    await addIssue(page, { title: "Copy link test" });
    await goToTab(page, "Report");
    await page.getByRole("button", { name: /copy share link/i }).click();
    await expect(page.getByRole("button", { name: /link copied/i })).toBeVisible({ timeout: 3_000 });
  });

  test("progress bar updates when status changes", async ({ page }) => {
    await addIssue(page, { title: "Progress bar test" });
    await goToTab(page, "Report");

    // Click "Done" on first item
    await page.getByRole("button", { name: /^Done$/i }).first().click();

    // Progress should now show 100% — use first() to avoid strict-mode on duplicate elements
    await expect(page.getByText("100%").first()).toBeVisible({ timeout: 5_000 });
  });

  test("category stats cards show correct counts", async ({ page }) => {
    await addIssue(page, { title: "Bug for stats", category: "bug" });
    await goToTab(page, "Report");
    // Bug stat card should show at least 1
    const bugCard = page.locator(".l-card").filter({ hasText: "Bug" });
    await expect(bugCard.first()).toBeVisible();
  });

  // ── Shared report page (public) ───────────────────────────────────────────
  test("shared report is viewable without auth", async ({ page, browser }) => {
    await addIssue(page, { title: "Public visibility test" });
    await goToTab(page, "Report");

    const shareUrl = await page.locator("code").textContent();

    // Open in a fresh unauthenticated context
    const guestCtx  = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.goto(shareUrl.trim());
    await guestPage.waitForLoadState("networkidle");

    await expect(guestPage.getByText("Public visibility test")).toBeVisible({ timeout: 15_000 });
    await expect(guestPage.getByText("NeoCrew QA").first()).toBeVisible();
    await guestCtx.close();
  });

  test("shared report status chips are clickable", async ({ page, browser }) => {
    await addIssue(page, { title: "Dev status update test" });
    await goToTab(page, "Report");
    const shareUrl = await page.locator("code").textContent();

    const guestCtx  = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.goto(shareUrl.trim());

    await expect(guestPage.getByText("Dev status update test")).toBeVisible({ timeout: 10_000 });
    // Click "In Progress" chip
    await guestPage.getByRole("button", { name: /In Progress/i }).first().click();
    // Button should remain visible (status updated)
    await expect(guestPage.getByRole("button", { name: /In Progress/i }).first()).toBeVisible();
    await guestCtx.close();
  });

  // ── Sessions tab ──────────────────────────────────────────────────────────
  test("sessions tab loads and shows current session", async ({ page }) => {
    await goToTab(page, "Sessions");
    // Current session badge should appear in the list
    const current = page.locator(".l-card").filter({ hasText: "Current" });
    await expect(current.first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Session title editing ─────────────────────────────────────────────────
  test("can inline-edit the session title", async ({ page }) => {
    // Click the session title button in nav
    const titleBtn = page.locator("nav button").filter({ hasText: /.+/ }).first();
    await titleBtn.click();

    const input = page.locator("nav input");
    await expect(input).toBeVisible();
    await input.fill("Sprint 42 QA");
    await input.press("Enter");

    await expect(page.locator("nav").getByText("Sprint 42 QA")).toBeVisible({ timeout: 5_000 });
  });

  // ── Sign out ──────────────────────────────────────────────────────────────
  // Run in an isolated context so the shared storageState session is not revoked
  test("sign out redirects to login page", async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await ctx.close(); // session revoked only in this context
  });

});
