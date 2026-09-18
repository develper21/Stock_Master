import { test, expect } from '@playwright/test';

// Note: These tests require a seeded database with test user credentials
// Run: npm run seed before running these tests

test.describe('Dashboard', () => {
  test.skip('Dashboard tests require database seeding', async () => {
    // These tests are skipped by default
    // To run them:
    // 1. Ensure your database is set up with the schema
    // 2. Run: npm run seed
    // 3. Remove the .skip from this describe block
  });

  // Uncomment and use these tests after seeding the database
  /*
  test.beforeEach(async ({ page }) => {
    // Login with seeded test user
    await page.goto('/auth/login');
    await page.fill('input[placeholder="manager.azhar"]', 'manager.central');
    await page.fill('input[placeholder="••••••••"]', 'StrongPass#1');
    await page.click('button:has-text("Access workspace")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Overview|Warehouse/);
  });

  test('should display user info', async ({ page }) => {
    await expect(page.locator('text=Welcome Back!')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
  */
});
