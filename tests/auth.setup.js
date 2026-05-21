/**
 * auth.setup.js — runs ONCE before all tests.
 *
 * Google OAuth cannot be automated headlessly (Google blocks it).
 * This setup does one of two things:
 *
 *  A) If playwright/.auth/user.json already exists → skip, reuse saved session.
 *  B) If not → open a HEADED browser, wait for you to log in manually via Google,
 *     then saves the session so all future runs are instant.
 *
 * To reset (force re-login): delete playwright/.auth/user.json
 */

const { test: setup, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // ── A: already have a saved session ──
  if (fs.existsSync(AUTH_FILE)) {
    console.log("✅ Using saved auth session (delete playwright/.auth/user.json to re-login)");
    return;
  }

  // ── B: need to log in manually ──
  console.log("\n🔐 No saved session found. Opening browser for one-time Google login…");
  console.log("   Sign in with your Google account, then wait — session will be saved automatically.\n");

  await page.goto("/login");

  // Click "Continue with Google"
  await page.getByRole("button", { name: /continue with google/i }).click();

  // Wait for Google OAuth → redirect back → land on "/"
  // Google's UI is interactive, so we just wait until the user finishes and lands back on the app
  await page.waitForURL("/", { timeout: 120_000 }); // 2 min to complete manual login

  // Confirm we're actually logged in (app uses <nav> not <header>)
  await expect(page.locator("nav")).toBeVisible();

  // Save the full browser state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`\n✅ Session saved to ${AUTH_FILE}\n    All future test runs will skip re-login.\n`);
});
