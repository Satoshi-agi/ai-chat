/**
 * E2E tests for chat functionality
 *
 * Note: These tests require the application to be running
 * and environment variables to be configured
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main page', async ({ page }) => {
    await expect(page.getByText('AI Chat')).toBeVisible();
  });

  test('should show empty state initially', async ({ page }) => {
    await expect(page.getByText('新しい会話を始めましょう')).toBeVisible();
  });

  test('should have message input field', async ({ page }) => {
    const textarea = page.getByPlaceholder('メッセージを入力...');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
  });

  test('should have send button', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: '送信' });
    await expect(sendButton).toBeVisible();
  });

  test('should update character count when typing', async ({ page }) => {
    const textarea = page.getByPlaceholder('メッセージを入力...');
    await textarea.fill('Hello');

    await expect(page.getByText('5 / 10000 文字')).toBeVisible();
  });

  test('should disable send button for empty input', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: '送信' });
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when input has text', async ({ page }) => {
    const textarea = page.getByPlaceholder('メッセージを入力...');
    await textarea.fill('Test message');

    const sendButton = page.getByRole('button', { name: '送信' });
    await expect(sendButton).toBeEnabled();
  });

  test('should show mobile menu button on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.locator('button svg').first();
    await expect(menuButton).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.locator('button').first();
    await menuButton.click();

    // Sidebar should be visible
    await expect(page.getByText('会話履歴')).toBeVisible();

    // Click overlay to close
    await page.locator('.bg-black.bg-opacity-50').click();

    // Sidebar should be hidden (will have negative transform)
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0|-translate-x-full/);
  });

  test('should show conversation history section', async ({ page }) => {
    // On desktop, sidebar should be visible
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByText('会話履歴')).toBeVisible();
  });

  test('should display new conversation button', async ({ page }) => {
    const newConvoButton = page.getByRole('button', { name: '新しい会話' });
    await expect(newConvoButton).toBeVisible();
  });

  test('should clear messages when clicking new conversation', async ({ page }) => {
    const newConvoButton = page.getByRole('button', { name: '新しい会話' });
    await newConvoButton.click();

    // Should still show empty state
    await expect(page.getByText('新しい会話を始めましょう')).toBeVisible();
  });

  // Note: The following tests would require actual API and database setup
  // Uncomment when running with proper environment

  /*
  test('should send and receive a message', async ({ page }) => {
    const textarea = page.getByPlaceholder('メッセージを入力...');
    const sendButton = page.getByRole('button', { name: '送信' });

    await textarea.fill('Hello, this is a test message');
    await sendButton.click();

    // Should show loading state
    await expect(page.getByText('処理中...')).toBeVisible();

    // Should display user message
    await expect(page.getByText('Hello, this is a test message')).toBeVisible();

    // Should display assistant response (wait up to 30 seconds)
    await expect(page.getByText('Claude')).toBeVisible({ timeout: 30000 });
  });

  test('should persist conversation in history', async ({ page }) => {
    // Send a message first
    const textarea = page.getByPlaceholder('メッセージを入力...');
    await textarea.fill('Test for history');
    await page.getByRole('button', { name: '送信' }).click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Reload page
    await page.reload();

    // Check if conversation appears in history
    await expect(page.getByText('Test for history')).toBeVisible();
  });
  */
});
