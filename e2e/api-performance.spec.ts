import { test, expect } from '@playwright/test';

// E2E test for API performance

test.describe('API Performance', () => {
    test('GET /api/menu should respond within threshold', async ({ request }) => {
        const startTime = Date.now();
        const response = await request.get('/api/menu');
        const duration = Date.now() - startTime;
        expect(response.status()).toBe(200);
        expect(duration).toBeLessThan(1000); // Check if response time is under 1000ms
    });

    test('POST /api/orders should respond within threshold', async ({ request }) => {
        const orderData = { /* mock order data */ };
        const startTime = Date.now();
        const response = await request.post('/api/orders', { data: orderData });
        const duration = Date.now() - startTime;
        expect(response.status()).toBe(201);
        expect(duration).toBeLessThan(1000); // Check if response time is under 1000ms
    });
});