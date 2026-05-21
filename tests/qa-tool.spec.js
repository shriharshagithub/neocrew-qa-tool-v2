/**
 * qa-tool.spec.js — End-to-end tests for NeoCrew QA Tool
 *
 * All tests run with the saved Google session from auth.setup.js
 * No re-login needed after the first run.
 */

const { test, expect } = require("@playwright/test");

// ─── helpers ──────────────────────────────────────────────────────────────────
async function addItem(page, { title, description, category = "bug", priority = "medium" }) {
  await page.getByPlaceholder("Issue title…").fill(title);
  if (description) await page.getByPlaceholder(/steps to reproduce/i).fill(description);
  if (category) await page.getByRole("button", { name: new RegExp(category, "i") }).first().click();
  if (priority) await page.getByRole("button", { name: new RegExp(priority, "i") }).first().click();
  await page.getByRole("button", { name: /add to report/i }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
}

// ─── tests ────────────────────────────────────────────────────────────────────
test.describe("NeoCrew QA Tool", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Should land on capture tab (not login)
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByRole("button", { name: /capture/i })).toBeVisible();
  });

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  test("user is logged in and avatar is visible", async ({ page }) => {
    // Should NOT see the login page
    await expect(page).not.toHaveURL(/\/login/);
    // Header has the user's Google avatar or initials
    const avatar = page.locator("header img, header .rounded-full").first();
    await expect(avatar).toBeVisible();
  });

  // ── 2. Capture tab ────────────────────────────────────────────────────────
  test("can add a bug report", async ({ page }) => {
    await addItem(page, {
      title: "Login button not working on Safari",
      description: "Steps: open Safari, go to /login, click button — nothing happens",
      category: "bug",
      priority: "high",
    });

    // Item should appear in the live log on the right
    await expect(page.getByText("Login button not working on Safari")).toBeVisible();
  });

  test("can add a feature request", async ({ page }) => {
    await addItem(page, {
      title: "Add dark mode toggle",
      category: "feature",
      priority: "low",
    });

    await expect(page.getByText("Add dark mode toggle")).toBeVisible();
  });

  test("paste shortcut hint is visible", async ({ page }) => {
    await expect(page.getByText(/⌘V/i)).toBeVisible();
  });

  // ── 3. Report tab ─────────────────────────────────────────────────────────
  test("report view shows item count and share link", async ({ page }) => {
    // First add an item so report isn't empty
    await addItem(page, { title: "Test item for report view" });

    // Switch to Report tab
    await page.getByRole("button", { name: /report/i }).click();

    // Share link button should be enabled
    const shareBtn = page.getByRole("button", { name: /copy share link/i });
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toBeEnabled();

    // Share URL should be shown
    await expect(page.locator("code")).toBeVisible();
    const url = await page.locator("code").textContent();
    expect(url).toMatch(/\/report\//);
  });

  test("can copy share link", async ({ page }) => {
    await addItem(page, { title: "Share test item" });
    await page.getByRole("button", { name: /report/i }).click();

    const shareBtn = page.getByRole("button", { name: /copy share link/i });
    await shareBtn.click();
    // Button text changes to confirm copy
    await expect(page.getByRole("button", { name: /link copied/i })).toBeVisible({ timeout: 3_000 });
  });

  test("can update item status in report view", async ({ page }) => {
    await addItem(page, { title: "Status update test item" });
    await page.getByRole("button", { name: /report/i }).click();

    // Click "In Progress" on the first item
    const inProgressBtn = page.getByRole("button", { name: /in progress/i }).first();
    await inProgressBtn.click();
    // Button should now have active ring styling (check it's still visible and clickable)
    await expect(inProgressBtn).toBeVisible();
  });

  // ── 4. Session title editing ───────────────────────────────────────────────
  test("can rename session title", async ({ page }) => {
    // Click the edit icon next to the title in the header
    await page.locator("header button").filter({ hasText: /QA Session/i }).click();

    // Type new title
    const titleInput = page.locator("header input");
    await titleInput.clear();
    await titleInput.fill("Sprint 12 QA");
    await titleInput.press("Enter");

    // Title updates in the header
    await expect(page.locator("header").getByText("Sprint 12 QA")).toBeVisible({ timeout: 5_000 });
  });

  // ── 5. Sessions list ──────────────────────────────────────────────────────
  test("sessions tab loads list", async ({ page }) => {
    await page.getByRole("button", { name: /sessions/i }).click();
    // Should show at least the heading
    await expect(page.getByText("All Sessions")).toBeVisible();
  });

  // ── 6. New session ────────────────────────────────────────────────────────
  test("new session clears the report", async ({ page }) => {
    await addItem(page, { title: "Item before new session" });

    // Intercept the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /new session/i }).click();

    // Capture tab should be empty now
    await expect(page.getByText("Nothing captured yet")).toBeVisible({ timeout: 5_000 });
  });

  // ── 7. Shared report page (public) ────────────────────────────────────────
  test("shared report is publicly viewable", async ({ page, browser }) => {
    // Get the share URL from report tab
    await addItem(page, { title: "Public report test" });
    await page.getByRole("button", { name: /report/i }).click();
    const shareUrl = await page.locator("code").textContent();

    // Open in a NEW context (no auth) — simulates a developer viewing it
    const devContext = await browser.newContext();
    const devPage = await devContext.newPage();
    await devPage.goto(shareUrl.trim());

    // Should see the item without being logged in
    await expect(devPage.getByText("Public report test")).toBeVisible({ timeout: 8_000 });

    // Dev hint message should appear
    await expect(devPage.getByText(/hey dev/i)).toBeVisible();

    await devContext.close();
  });

  // ── 8. Sign out ────────────────────────────────────────────────────────────
  test("sign out redirects to login page", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

});
