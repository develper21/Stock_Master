import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Login with your StockMaster ID');
    await expect(page.getByPlaceholder('manager.azhar')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Access workspace/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="manager.azhar"]', 'invalid_user');
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword');

    // Wait for the API response
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.status() === 401
    );

    await page.click('button:has-text("Access workspace")');

    // Wait for response
    await responsePromise;

    // Wait a bit for UI to update
    await page.waitForTimeout(500);

    // Check if error message appears (try multiple possible selectors)
    const hasError = await page.locator('.text-rose-400').count() > 0 ||
      await page.locator('text=/Invalid|credentials|error/i').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.click('text=Forgot?');
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await expect(page.locator('h2')).toContainText('Forgot your password?');
  });

  test('should navigate to signup', async ({ page }) => {
    await page.click('text=Create an account');
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.locator('h2')).toContainText('Bring StockMaster to your floor');
  });
});
