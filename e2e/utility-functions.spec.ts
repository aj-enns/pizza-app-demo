import { test, expect } from '@playwright/test';

// E2E test for utility functions performance

test.describe('Utility Functions Performance', () => {
    test('calculateItemPrice should complete within threshold', async () => {
        const startTime = Date.now();
        const price = calculateItemPrice(10, 2); // Example usage
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100); // Check if calculation is under 100ms
    });

    test('calculateCartTotals should complete within threshold', async () => {
        const startTime = Date.now();
        const total = calculateCartTotals([{ price: 10, quantity: 2 }]); // Example usage
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100); // Check if calculation is under 100ms
    });
});