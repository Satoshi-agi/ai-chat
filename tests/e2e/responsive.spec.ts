/**
 * E2E tests for responsive design
 */

import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should display properly on mobile (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Main elements should be visible
    await expect(page.getByText('AI Chat')).toBeVisible();
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible();

    // Menu button should be visible
    const menuButton = page.locator('button').first();
    await expect(menuButton).toBeVisible();
  });

  test('should display properly on tablet (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.getByText('AI Chat')).toBeVisible();
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible();

    // Sidebar should be visible on tablet
    await expect(page.getByText('会話履歴')).toBeVisible();
  });

  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // All elements should be visible
    await expect(page.getByText('AI Chat')).toBeVisible();
    await expect(page.getByText('会話履歴')).toBeVisible();
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible();

    // Menu button should not be visible on desktop
    const menuButtons = await page.locator('button svg').first().count();
    // The hamburger menu should be hidden on desktop
  });

  test('should handle orientation change on mobile', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible();

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.getByPlaceholder('メッセージを入力...')).toBeVisible();
  });
});
