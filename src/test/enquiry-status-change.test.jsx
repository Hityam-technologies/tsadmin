import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn();

vi.mock('../services/apiClient', () => ({
  apiRequest: (...args) => apiRequest(...args),
}));

import { enquiryService } from '../services/enquiryService';

describe('Enquiry Management & Status Lifecycle', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it('updates an enquiry status through the API', async () => {
    apiRequest
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'ENQ-2041', status: 'contacted', notes: [{ text: 'Status changed to contacted' }] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'ENQ-2041',
          status: 'confirmed',
          notes: [
            { text: 'Status changed to contacted' },
            { text: 'Status changed to confirmed' },
          ],
        },
      });

    const res1 = await enquiryService.updateStatus('ENQ-2041', 'contacted');
    expect(res1.success).toBe(true);
    expect(res1.data.status).toBe('contacted');

    const res2 = await enquiryService.updateStatus('ENQ-2041', 'confirmed');
    expect(res2.success).toBe(true);
    expect(res2.data.status).toBe('confirmed');
    expect(res2.data.notes[res2.data.notes.length - 1].text).toContain('Status changed');
  });

  it('appends an internal note through the API', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        text: 'Client scheduled store viewing on Friday 4 PM',
        author: 'Meenakshi Iyer',
      },
    });

    const res = await enquiryService.addNote(
      'ENQ-2041',
      'Client scheduled store viewing on Friday 4 PM',
      'Meenakshi Iyer',
    );
    expect(res.success).toBe(true);
    expect(res.data.text).toBe('Client scheduled store viewing on Friday 4 PM');
    expect(res.data.author).toBe('Meenakshi Iyer');
  });

  it('exports customer enquiries to CSV through the API', async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: {
        csv: 'ID,Customer Name,Phone,Email\nENQ-2041,Asha,+91,asha@example.com',
        filename: 'enquiries.csv',
      },
    });

    const res = await enquiryService.exportCsv();
    expect(res.success).toBe(true);
    expect(res.data.csv).toContain('ID,Customer Name,Phone,Email');
    expect(res.data.csv).toContain('ENQ-2041');
    expect(res.data.filename).toContain('.csv');
  });
});
