import { describe, it, expect } from 'vitest';
import { sareeService } from '../services/sareeService';

describe('Saree Form Validation & Catalog Operations', () => {
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
