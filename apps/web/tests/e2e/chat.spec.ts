/**
 * E2E Tests for Chat Interface
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
  });

  test('should load chat interface', async ({ page }) => {
    // Verify chat interface is visible
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-btn"]')).toBeVisible();
  });

  test('should send a message and receive a response', async ({ page }) => {
    // Type a message
    await page.fill('[data-testid="message-input"]', 'Hello!');

    // Send message
    await page.click('[data-testid="send-btn"]');

    // Verify message appears in chat
    await expect(page.locator('text=Hello!')).toBeVisible({ timeout: 3000 });

    // Wait for AI response
    await expect(page.locator('[data-testid="message-bubble"][data-role="assistant"]')).toBeVisible({ timeout: 15000 });
  });

  test('should change personality mode', async ({ page }) => {
    // Open personality selector
    await page.click('[data-testid="personality-selector"]');

    // Select "Sarcastic" personality
    await page.click('[data-testid="personality-sarcastic"]');

    // Verify personality changed
    await expect(page.locator('text=Sarcastic')).toBeVisible();

    // Send a message
    await page.fill('[data-testid="message-input"]', 'Tell me about codes');
    await page.click('[data-testid="send-btn"]');

    // Verify response is received
    await expect(page.locator('[data-testid="message-bubble"][data-role="assistant"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show typing indicator while waiting for response', async ({ page }) => {
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Hello!');
    await page.click('[data-testid="send-btn"]');

    // Verify typing indicator appears
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 2000 });

    // Verify typing indicator disappears after response
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 15000 });
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Send multiple messages quickly
    for (let i = 0; i < 12; i++) {
      await page.fill('[data-testid="message-input"]', `Message ${i}`);
      await page.click('[data-testid="send-btn"]');
      await page.waitForTimeout(100);
    }

    // Verify rate limit error message
    await expect(page.locator('text=Rate limit exceeded')).toBeVisible({ timeout: 5000 });
  });

  test('should persist chat history', async ({ page }) => {
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Remember this message');
    await page.click('[data-testid="send-btn"]');

    // Wait for response
    await page.waitForTimeout(5000);

    // Reload page
    await page.reload();

    // Verify message is still there
    await expect(page.locator('text=Remember this message')).toBeVisible({ timeout: 3000 });
  });
});
