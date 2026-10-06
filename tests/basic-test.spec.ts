import { test, expect } from '@playwright/test';

test.describe("Base URL loads", () => {
  test.setTimeout(120_000);

  test('should load the base url successfully', async ({ page }) => {
    await test.step("navigate to application base url", async () => {
      const response = await page.goto('/');
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { name: 'Vehicle search' })).toBeVisible();
    });
  });
});
