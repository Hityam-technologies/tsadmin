import { apiRequest, db, recordAuditLog } from './apiClient';

export const enquiryService = {
  /**
   * Get Enquiries
   * API: GET /admin/enquiries
   */
  async getEnquiries(params = {}) {
    return apiRequest('/admin/enquiries', {
      method: 'GET',
      query: { status: params.status, search: params.search, page: params.page, limit: params.limit },
    }, async () => {
      const { status = 'all', search = '', page = 1, limit = 10 } = params;

      let list = [...db.enquiries];

      if (status && status !== 'all') {
        list = list.filter((e) => e.status === status);
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (e) =>
            e.customerName.toLowerCase().includes(q) ||
            e.customerPhone.toLowerCase().includes(q) ||
            e.customerEmail.toLowerCase().includes(q) ||
            e.sareeTitle.toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = list.length;
      const startIndex = (page - 1) * limit;
      const paginated = list.slice(startIndex, startIndex + limit);

      return {
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  },

  /**
   * Get Enquiry by ID
   * API: GET /admin/enquiries/:id
   */
  async getEnquiryById(id) {
    return apiRequest(`/admin/enquiries/${id}`, { method: 'GET' }, async () => {
      const found = db.enquiries.find((e) => e.id === id);
      if (!found) throw new Error(`Enquiry ${id} not found`);
      return found;
    });
  },

  /**
   * Update Enquiry Status
   * API: PUT /admin/enquiries/:id/status
   */
  async updateStatus(id, newStatus) {
    return apiRequest(
      `/admin/enquiries/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status: newStatus }) },
      async () => {
        const enquiry = db.enquiries.find((e) => e.id === id);
        if (!enquiry) throw new Error(`Enquiry ${id} not found`);

        const oldStatus = enquiry.status;
        enquiry.status = newStatus;
        enquiry.updatedAt = new Date().toISOString();

        // Add internal auto-note
        enquiry.notes.push({
          id: `note-${Date.now()}`,
          author: 'System',
          text: `Status changed from ${oldStatus} to ${newStatus}.`,
          timestamp: new Date().toISOString(),
        });

        recordAuditLog('UPDATE_ENQUIRY_STATUS', id, `Updated enquiry ${id} status to ${newStatus}`);
        return enquiry;
      }
    );
  },

  /**
   * Add Internal Note
   * API: POST /admin/enquiries/:id/notes
   */
  async addNote(id, text, authorName = 'Staff Stylist') {
    return apiRequest(
      `/admin/enquiries/${id}/notes`,
      { method: 'POST', body: JSON.stringify({ text }) },
      async () => {
        const enquiry = db.enquiries.find((e) => e.id === id);
        if (!enquiry) throw new Error(`Enquiry ${id} not found`);

        const newNote = {
          id: `note-${Date.now()}`,
          author: authorName,
          text,
          timestamp: new Date().toISOString(),
        };

        enquiry.notes.unshift(newNote);
        enquiry.updatedAt = new Date().toISOString();

        recordAuditLog('ADD_ENQUIRY_NOTE', id, `Appended note to enquiry ${id}`);
        return newNote;
      }
    );
  },

  /**
   * Export Enquiries as CSV
   * API: GET /admin/enquiries/export
   */
  async exportCsv() {
    return apiRequest('/admin/enquiries/export', { method: 'GET' }, async () => {
      const headers = ['ID', 'Customer Name', 'Phone', 'Email', 'Saree Title', 'Price', 'Status', 'Channel', 'Date'];
      const rows = db.enquiries.map((e) => [
        e.id,
        `"${e.customerName}"`,
        `"${e.customerPhone}"`,
        `"${e.customerEmail}"`,
        `"${e.sareeTitle}"`,
        `"${e.sareePrice}"`,
        e.status,
        e.channel,
        new Date(e.createdAt).toLocaleDateString('en-IN'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      recordAuditLog('EXPORT_CSV', 'enquiries', 'Exported customer inquiries CSV report');
      return { csv: csvContent, filename: `tripuraa-enquiries-${new Date().toISOString().slice(0, 10)}.csv` };
    });
  },
};

