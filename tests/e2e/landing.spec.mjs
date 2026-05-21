import { test, expect } from '@playwright/test';

test.describe('Landing-Page (/)', () => {
  test('zeigt die Landing-Page, nicht die App', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KI-Korrektur für Schweizer Lehrpersonen/);
    await expect(page.locator('h1')).toContainText('10 Minuten');
    // Die App hätte die Tab-Navigation – die darf auf der Landing-Page NICHT existieren.
    await expect(page.locator('#tab-dashboard')).toHaveCount(0);
  });

  test('verlinkt im Header auf die App', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a.btn-nav')).toHaveAttribute('href', '/app');
  });

  test('zeigt die Preis-Sektion', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#preise')).toBeVisible();
  });

  test('zeigt die FAQ-Sektion', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#faq')).toBeVisible();
  });
});

test.describe('Cookie-Banner', () => {
  test('erscheint beim ersten Besuch', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cookie-banner')).toBeVisible();
  });

  test('lässt sich mit «Verstanden» schliessen und bleibt nach Reload weg', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();

    await banner.getByRole('button', { name: 'Verstanden' }).click();
    await expect(banner).toBeHidden();

    // Consent ist in localStorage gespeichert – Banner bleibt nach Reload verborgen.
    await page.reload();
    await expect(page.locator('#cookie-banner')).toBeHidden();
  });
});
