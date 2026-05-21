import { test, expect } from '@playwright/test';

// Diese Tests fahren die Routing-Reihenfolge aus vercel.json gegen den
// Vercel-Emulator (tests/e2e/static-server.mjs). Sie hätten die Routing-Bugs
// aus PR #45 / #50 abgefangen, bei denen "/" die App statt der Landing-Page zeigte.
test.describe('Routing & Redirects', () => {
  test('/ liefert die Landing-Page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('10 Minuten');
  });

  test('/app liefert die App', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator('#tab-dashboard')).toBeVisible();
  });

  test('/?activate=… leitet auf die App weiter', async ({ page }) => {
    await page.goto('/?activate=TESTKEY');
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator('#tab-dashboard')).toBeVisible();
  });

  test('/?mode=… leitet auf die App weiter', async ({ page }) => {
    await page.goto('/?mode=demo');
    await expect(page).toHaveURL(/\/app$/);
  });

  test('/landing leitet auf die Landing-Page weiter', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('10 Minuten');
  });

  test('rechtliche Seiten sind über saubere URLs erreichbar', async ({ page }) => {
    const seiten = [
      { pfad: '/datenschutz', text: /Datenschutz/i },
      { pfad: '/agb', text: /Allgemeine Geschäftsbedingungen|AGB/i },
      { pfad: '/avv', text: /Auftragsverarbeitung|AVV/i },
    ];
    for (const { pfad, text } of seiten) {
      // waitUntil: 'commit' – die sauberen URLs landen via Meta-Refresh-Stub auf
      // der .html-Seite; ohne 'commit' liefe goto in ein Navigations-Race.
      await page.goto(pfad, { waitUntil: 'commit' });
      await expect(page.locator('h1')).toContainText(text);
    }
  });
});
