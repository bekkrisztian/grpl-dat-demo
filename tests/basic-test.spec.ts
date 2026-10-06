import { test, expect, defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 240_000,
});

// Define variables
let BASE_URL = (!process.env.BASE_URL) ? 'http://localhost:4000' : process.env.BASE_URL;

test.describe("Base URL loads", () => {
  test.setTimeout(120_000);

  test('should load the base url successfully', async ({ page }) => {
    await test.step("navigate to application base url", async () => {
      const response = await page.goto(BASE_URL);
      await page.waitForTimeout(500);
      expect(response?.ok()).toBeTruthy();
    });
  });
});
