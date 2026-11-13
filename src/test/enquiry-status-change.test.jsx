import { describe, it, expect } from 'vitest';
import { enquiryService } from '../services/enquiryService';

describe('Enquiry Management & Status Lifecycle', () => {
  it('updates an enquiry status from new to contacted to confirmed', async () => {
    // 1. Advance to contacted
    const res1 = await enquiryService.updateStatus('ENQ-2041', 'contacted');
    expect(res1.success).toBe(true);
    expect(res1.data.status).toBe('contacted');

    // 2. Advance to confirmed
    const res2 = await enquiryService.updateStatus('ENQ-2041', 'confirmed');
    expect(res2.success).toBe(true);
    expect(res2.data.status).toBe('confirmed');

    // Verify auto-notes logged in timeline
    const notes = res2.data.notes;
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[notes.length - 1].text).toContain('Status changed');
  });

  it('appends an internal stylist note to an enquiry', async () => {
    const res = await enquiryService.addNote(
      'ENQ-2041',
      'Client scheduled store viewing on Friday 4 PM',
      'Meenakshi Iyer'
    );
    expect(res.success).toBe(true);
    expect(res.data.text).toBe('Client scheduled store viewing on Friday 4 PM');
    expect(res.data.author).toBe('Meenakshi Iyer');
  });

  it('exports customer enquiries to CSV with required columns', async () => {
    const res = await enquiryService.exportCsv();
    expect(res.success).toBe(true);
    expect(res.data.csv).toContain('ID,Customer Name,Phone,Email');
    expect(res.data.csv).toContain('ENQ-2041');
    expect(res.data.filename).toContain('.csv');
  });
});

