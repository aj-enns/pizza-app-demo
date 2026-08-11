import { test, expect } from '@playwright/test';

// E2E test for Performance Monitor

test.describe('Performance Monitor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/'); // Navigate to the homepage
        await page.waitForSelector('button[data-testid="activity-button"]'); // Wait for the Performance Monitor button
    });

    test('should display performance metrics', async ({ page }) => {
        await page.click('button[data-testid="activity-button"]'); // Open Performance Monitor
        const metricsVisible = await page.isVisible('text=Total ops'); // Check if metrics are displayed
        expect(metricsVisible).toBe(true);
    });

    test('should highlight slow operations', async ({ page }) => {
        await page.click('button[data-testid="activity-button"]'); // Open Performance Monitor
        const slowOps = await page.locator('text=Slow operations');
        expect(await slowOps.count()).toBeGreaterThan(0); // Ensure there are slow operations listed
    });
});