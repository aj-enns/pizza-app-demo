/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/menu', () => {
  it('should return menu data successfully', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('should return pizzas array', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.data.pizzas).toBeDefined();
    expect(Array.isArray(data.data.pizzas)).toBe(true);
    expect(data.data.pizzas.length).toBeGreaterThan(0);
  });

  it('should return toppings array', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.data.toppings).toBeDefined();
    expect(Array.isArray(data.data.toppings)).toBe(true);
    expect(data.data.toppings.length).toBeGreaterThan(0);
  });

  it('should return pizzas with required properties', async () => {
    const response = await GET();
    const data = await response.json();
    
    const pizza = data.data.pizzas[0];
    expect(pizza).toHaveProperty('id');
    expect(pizza).toHaveProperty('name');
    expect(pizza).toHaveProperty('description');
    expect(pizza).toHaveProperty('category');
    expect(pizza).toHaveProperty('basePrice');
    expect(pizza).toHaveProperty('sizes');
    expect(pizza).toHaveProperty('defaultToppings');
  });

  it('should return toppings with required properties', async () => {
    const response = await GET();
    const data = await response.json();
    
    const topping = data.data.toppings[0];
    expect(topping).toHaveProperty('id');
    expect(topping).toHaveProperty('name');
    expect(topping).toHaveProperty('price');
    expect(topping).toHaveProperty('category');
  });

  it('should have consistent data structure', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data).toEqual({
      success: true,
      data: expect.objectContaining({
        pizzas: expect.any(Array),
        toppings: expect.any(Array),
      }),
    });
  });
});
