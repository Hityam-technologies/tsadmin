import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn();

vi.mock('../services/apiClient', () => ({
  apiRequest: (...args) => apiRequest(...args),
}));

import { sareeService } from '../services/sareeService';

describe('Table Filters & Pagination Logic', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it('requests sarees with a search query', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            title: 'Swarna Kanchipuram',
            weave: 'Kanchipuram Handloom',
            origin: 'Kanchipuram, Tamil Nadu',
            category: 'sarees',
            numericPrice: 28500,
          },
        ],
        total: 1,
        page: 1,
        limit: 8,
        totalPages: 1,
      },
    });

    const res = await sareeService.getSarees({ search: 'Kanchipuram' });
    expect(res.success).toBe(true);
    expect(apiRequest).toHaveBeenCalledWith('/admin/sarees', expect.objectContaining({
      method: 'GET',
      query: expect.objectContaining({ search: 'Kanchipuram' }),
    }));
    expect(res.data.items[0].title.toLowerCase()).toContain('kanchipuram');
  });

  it('requests sarees filtered by category', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        items: [{ title: 'Bridal Silk', category: 'bridal', numericPrice: 40000 }],
        total: 1,
        page: 1,
        limit: 8,
        totalPages: 1,
      },
    });

    const res = await sareeService.getSarees({ category: 'bridal' });
    expect(res.success).toBe(true);
    expect(apiRequest).toHaveBeenCalledWith('/admin/sarees', expect.objectContaining({
      query: expect.objectContaining({ category: 'bridal' }),
    }));
    res.data.items.forEach((item) => expect(item.category).toBe('bridal'));
  });

  it('requests price ascending sort', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        items: [
          { title: 'A', numericPrice: 20000 },
          { title: 'B', numericPrice: 30000 },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    const res = await sareeService.getSarees({ sortBy: 'price_asc', limit: 20 });
    expect(res.success).toBe(true);
    expect(apiRequest).toHaveBeenCalledWith('/admin/sarees', expect.objectContaining({
      query: expect.objectContaining({ sortBy: 'price_asc', limit: 20 }),
    }));
    expect(res.data.items[0].numericPrice).toBeLessThanOrEqual(res.data.items[1].numericPrice);
  });

  it('requests paginated records', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        total: 10,
        page: 1,
        limit: 3,
        totalPages: 4,
      },
    });

    const page1Res = await sareeService.getSarees({ page: 1, limit: 3 });
    expect(page1Res.success).toBe(true);
    expect(page1Res.data.items.length).toBe(3);
    expect(page1Res.data.totalPages).toBeGreaterThanOrEqual(1);
    expect(apiRequest).toHaveBeenCalledWith('/admin/sarees', expect.objectContaining({
      query: expect.objectContaining({ page: 1, limit: 3 }),
    }));
  });
});
