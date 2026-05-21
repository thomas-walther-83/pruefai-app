import { test, expect } from '@playwright/test';

test.describe('App (/app)', () => {
  test('lädt die App-Shell mit Tab-Navigation', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('.header__logo')).toContainText('Pruefai');
    await expect(page.locator('#tab-dashboard')).toBeVisible();
    await expect(page.locator('#tab-korrektur')).toBeVisible();
    // Dashboard ist die Standard-Ansicht.
    await expect(page.locator('#view-dashboard')).toHaveClass(/active/);
  });

  test('wechselt die Ansicht beim Klick auf einen Tab', async ({ page }) => {
    await page.goto('/app');
    await page.locator('#tab-klassen').click();
    await expect(page.locator('#view-klassen')).toHaveClass(/active/);
    await expect(page.locator('#view-dashboard')).not.toHaveClass(/active/);
  });
});
