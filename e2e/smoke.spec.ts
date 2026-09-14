import { test, expect } from '@playwright/test';

test.describe('Production Smoke Suite (AGENTS.md Rule 46)', () => {
  test('should load landing page with hero text and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Next.js Production Template/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /explore live dashboard/i })).toBeVisible();
  });

  test('should verify health API endpoint is healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const json = (await response.json()) as {
      success: boolean;
      data: { status: string; checks: { liveness: string; readiness: string } };
    };
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
  });

  test('should navigate to login page and render accessible sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in to portal/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should navigate to dashboard and render orders list and metrics', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /enterprise orders/i })).toBeVisible();
    await expect(page.getByText(/total pipeline/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ new order/i })).toBeVisible();
  });
});
