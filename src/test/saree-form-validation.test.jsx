import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sareeService } from '../services/sareeService';

describe('Saree Form Validation & Catalog Operations', () => {
  let db;

  beforeEach(() => {
    db = new Map([
      [
        'saree-1',
        {
          id: 'saree-1',
          title: 'Royal Kanjivaram Silk',
          price: '₹35,000',
          numericPrice: 35000,
          stockQuantity: 3,
        },
      ],
      [
        'saree-10',
        {
          id: 'saree-10',
          title: 'Heritage Silk',
          price: '₹24,000',
          numericPrice: 24000,
          stockQuantity: 1,
        },
      ],
    ]);

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init = {}) => {
      const target = String(url);
      const method = (init.method || 'GET').toUpperCase();
      const formatInr = (num) => `₹${Number(num || 0).toLocaleString('en-IN')}`;

      if (target.endsWith('/api/v1/admin/sarees') && method === 'POST') {
        const body = JSON.parse(init.body || '{}');
        const created = {
          ...body,
          id: `saree-${Date.now()}`,
          price: formatInr(body.numericPrice),
          mrp: formatInr(body.numericMrp),
        };
        db.set(created.id, created);
        return { ok: true, status: 201, json: async () => ({ success: true, data: created }) };
      }

      const dupMatch = target.match(/\/api\/v1\/admin\/sarees\/([^/]+)\/duplicate$/);
      if (dupMatch && method === 'POST') {
        const src = db.get(dupMatch[1]);
        if (!src) return { ok: false, status: 404, json: async () => ({ success: false, error: { message: 'Not found' } }) };
        const copy = { ...src, id: `${src.id}-copy`, title: `${src.title} (Copy)` };
        db.set(copy.id, copy);
        return { ok: true, status: 201, json: async () => ({ success: true, data: copy }) };
      }

      const itemMatch = target.match(/\/api\/v1\/admin\/sarees\/([^/?]+)$/);
      if (itemMatch) {
        const id = itemMatch[1];
        const existing = db.get(id);
        if (!existing) {
          return { ok: false, status: 404, json: async () => ({ success: false, error: { message: 'Not found' } }) };
        }
        if (method === 'GET') {
          return { ok: true, status: 200, json: async () => ({ success: true, data: existing }) };
        }
        if (method === 'PUT') {
          const patch = JSON.parse(init.body || '{}');
          const updated = {
            ...existing,
            ...patch,
            ...(patch.numericPrice != null ? { price: formatInr(patch.numericPrice) } : {}),
          };
          db.set(id, updated);
          return { ok: true, status: 200, json: async () => ({ success: true, data: updated }) };
        }
        if (method === 'DELETE') {
          db.delete(id);
          return { ok: true, status: 200, json: async () => ({ success: true, data: { deleted: true } }) };
        }
      }

      return { ok: false, status: 404, json: async () => ({ success: false, error: { message: 'Not found' } }) };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new saree with valid attributes and calculates INR formatted strings', async () => {
    const newSaree = {
      title: 'Aura of Ayodhya Banarasi Katan Silk',
      brand: 'Tripuraa Heritage',
      slug: 'aura-of-ayodhya-banarasi',
      category: 'katan',
      numericPrice: 42000,
      numericMrp: 49000,
      weave: 'Kadhwa Banarasi',
      fabric: 'Pure Mulberry Katan',
      zari: 'Antique Gold Zari',
      origin: 'Varanasi, UP',
      stockQuantity: 2,
      images: ['https://example.com/saree1.jpg'],
      image: 'https://example.com/saree1.jpg',
      isFeatured: true,
      isActive: true,
    };

    const res = await sareeService.createSaree(newSaree);
    expect(res.success).toBe(true);
    expect(res.data.id).toBeDefined();
    expect(res.data.price).toBe('₹42,000');
    expect(res.data.mrp).toBe('₹49,000');
    expect(res.data.title).toBe('Aura of Ayodhya Banarasi Katan Silk');
  });

  it('updates an existing saree price and specs correctly', async () => {
    const updateRes = await sareeService.updateSaree('saree-1', {
      numericPrice: 29500,
      stockQuantity: 5,
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.data.price).toBe('₹29,500');
    expect(updateRes.data.stockQuantity).toBe(5);
  });

  it('duplicates an existing saree listing with -copy suffix', async () => {
    const dupRes = await sareeService.duplicateSaree('saree-1');
    expect(dupRes.success).toBe(true);
    expect(dupRes.data.title).toContain('(Copy)');
    expect(dupRes.data.id).not.toBe('saree-1');
  });

  it('deletes a saree listing permanently', async () => {
    const delRes = await sareeService.deleteSaree('saree-10');
    expect(delRes.success).toBe(true);

    const getRes = await sareeService.getSareeById('saree-10');
    expect(getRes.success).toBe(false);
  });
});
