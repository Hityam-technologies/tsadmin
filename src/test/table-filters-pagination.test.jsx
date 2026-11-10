import { describe, it, expect } from 'vitest';
import { sareeService } from '../services/sareeService';

describe('Table Filters & Pagination Logic', () => {
  it('filters sarees by search query in title or weave', async () => {
    const res = await sareeService.getSarees({ search: 'Kanchipuram' });
    expect(res.success).toBe(true);
    expect(res.data.items.length).toBeGreaterThan(0);
    res.data.items.forEach((item) => {
      const match =
        item.title.toLowerCase().includes('kanchipuram') ||
        item.weave.toLowerCase().includes('kanchipuram') ||
        item.origin.toLowerCase().includes('kanchipuram');
      expect(match).toBe(true);
    });
  });

  it('filters sarees strictly by category', async () => {
    const res = await sareeService.getSarees({ category: 'bridal' });
    expect(res.success).toBe(true);
    expect(res.data.items.length).toBeGreaterThan(0);
    res.data.items.forEach((item) => {
      expect(item.category).toBe('bridal');
    });
  });

  it('sorts sarees by price ascending correctly', async () => {
    const res = await sareeService.getSarees({ sortBy: 'price_asc', limit: 20 });
    expect(res.success).toBe(true);
    const items = res.data.items;
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i].numericPrice).toBeLessThanOrEqual(items[i + 1].numericPrice);
    }
  });

  it('paginates records properly with correct total and page slices', async () => {
    const page1Res = await sareeService.getSarees({ page: 1, limit: 3 });
    expect(page1Res.success).toBe(true);
    expect(page1Res.data.items.length).toBe(3);
    expect(page1Res.data.totalPages).toBeGreaterThanOrEqual(1);

    const page2Res = await sareeService.getSarees({ page: 2, limit: 3 });
    expect(page2Res.success).toBe(true);
    expect(page2Res.data.items.length).toBe(3);
    // Page 1 and Page 2 should have different first items
    expect(page1Res.data.items[0].id).not.toBe(page2Res.data.items[0].id);
  });
});

