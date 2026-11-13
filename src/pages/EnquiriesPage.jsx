import React, { useState, useEffect, useCallback } from 'react';
import { enquiryService } from '../services/enquiryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  Sparkles,
  Search,
  Download,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  Send,
  User,
  ShoppingBag,
} from 'lucide-react';

export function EnquiriesPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Detail Drawer / Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    const res = await enquiryService.getEnquiries({
      status: statusFilter,
      search,
      page,
      limit: 10,
    });
    if (res.success) {
      setEnquiries(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    const res = await enquiryService.exportCsv();
    if (res.success) {
      const blob = new Blob([res.data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', res.data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported enquiries to CSV', 'success');
    }
  };

  // Open Detail
  const handleOpenDetail = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDetailOpen(true);
    setNoteText('');
  };

  // Change Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedEnquiry) return;
    const res = await enquiryService.updateStatus(selectedEnquiry.id, newStatus);
    if (res.success) {
      setSelectedEnquiry(res.data);
      showToast(`Status updated to ${newStatus}`, 'success');
      fetchEnquiries();
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedEnquiry) return;

    setIsSubmittingNote(true);
    const res = await enquiryService.addNote(
      selectedEnquiry.id,
      noteText.trim(),
      currentUser?.name || '-'
    );
    if (res.success) {
      setSelectedEnquiry({
        ...selectedEnquiry,
        notes: [res.data, ...(selectedEnquiry.notes || [])],
      });
      setNoteText('');
      showToast('Internal note appended', 'info');
      fetchEnquiries();
    }
    setIsSubmittingNote(false);
  };

  const statusTabs = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'closed', label: 'Closed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
            Concierge CRM
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Client Inquiries & Bespoke Orders
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            Manage high-value handloom consultations, custom bridal requests, and WhatsApp concierge leads.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-sand-300 hover:bg-sand-50 text-charcoal-700 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-gold-600" /> Export CSV Report
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] space-y-3.5">
        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-sand-200">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-gold-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:bg-sand-100 hover:text-charcoal-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by client name, phone, email, saree, or inquiry ID..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-sand-300 focus:border-gold-500 text-charcoal-900 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : enquiries.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No inquiries found"
            description="No customer inquiries correspond to this status tab or search filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-sand-50/80 border-b border-sand-200 text-charcoal-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Inquiry ID</th>
                  <th className="py-3.5 px-3">Customer Profile</th>
                  <th className="py-3.5 px-3">Target Saree</th>
                  <th className="py-3.5 px-3">Channel</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-charcoal-800">
                {enquiries.map((enq) => (
                  <tr
                    key={enq.id}
                    onClick={() => handleOpenDetail(enq)}
                    className="hover:bg-sand-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pl-6 pr-3 font-mono font-semibold text-gold-800 text-[11px]">
                      {enq.id}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-charcoal-900">{enq.customerName}</div>
                      <span className="text-[11px] text-charcoal-500 block">{enq.customerPhone}</span>
                      <span className="text-[10px] text-charcoal-400 block">{enq.customerEmail}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-medium text-charcoal-900 line-clamp-1">
                        {enq.sareeTitle}
                      </span>
                      <span className="text-gold-700 font-semibold text-[11px] block">
                        {enq.sareePrice}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 capitalize">
                      <div className="flex items-center gap-1.5 text-charcoal-600">
                        {enq.channel === 'whatsapp' && (
                          <MessageCircle className="w-3.5 h-3.5 text-gold-700" />
                        )}
                        {enq.channel === 'call' && <Phone className="w-3.5 h-3.5 text-saffron-600" />}
                        {enq.channel === 'app_inquiry' && (
                          <Sparkles className="w-3.5 h-3.5 text-gold-700" />
                        )}
                        <span>{enq.channel.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          enq.status === 'new'
                            ? 'saffron'
                            : enq.status === 'contacted'
                            ? 'blue'
                            : enq.status === 'confirmed'
                            ? 'gold'
                            : enq.status === 'closed'
                            ? 'gold'
                            : 'maroon'
                        }
                        size="xs"
                      >
                        {enq.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-500 text-[11px]">
                      {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-gold-700 font-semibold group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>View</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Inquiry Detail Drawer / Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Inquiry ${selectedEnquiry?.id}`}
        subtitle={`Created on ${
          selectedEnquiry?.createdAt
            ? new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')
            : ''
        }`}
        maxWidth="max-w-3xl"
      >
        {selectedEnquiry && (
          <div className="space-y-6 pt-1">
            {/* Customer & Saree Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gold-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                      Customer Profile
                    </span>
                  </div>
                  <Badge variant="gold" size="xs">
                    Client
                  </Badge>
                </div>

                <div className="text-sm font-bold text-charcoal-900 mb-1">
                  {selectedEnquiry.customerName}
                </div>
                <div className="text-xs text-charcoal-600 space-y-0.5 mb-4">
                  <div>Phone: {selectedEnquiry.customerPhone}</div>
                  <div>Email: {selectedEnquiry.customerEmail}</div>
                </div>

                {/* 1-Tap Client Actions: Call, WhatsApp, Email */}
                <div className="flex items-center gap-2 pt-2 border-t border-sand-200">
                  <a
                    href={`tel:${selectedEnquiry.customerPhone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-sand-300 hover:bg-sand-100 text-xs font-semibold text-charcoal-800 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-gold-600" /> Call
                  </a>

                  <a
                    href={`https://wa.me/${selectedEnquiry.customerPhone.replace(
                      /[^0-9]/g,
                      ''
                    )}?text=${encodeURIComponent(
                      `Namaste ${selectedEnquiry.customerName}, regarding your inquiry for ${selectedEnquiry.sareeTitle} at Tripuraa Sangrahah:`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gold-600 hover:bg-gold-700 text-xs font-semibold text-white transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>

                  <a
                    href={`mailto:${selectedEnquiry.customerEmail}?subject=${encodeURIComponent(
                      `Tripuraa Sangrahah Consultation — ${selectedEnquiry.sareeTitle}`
                    )}`}
                    className="p-2 rounded-lg bg-white border border-sand-300 hover:bg-sand-100 text-charcoal-700 transition-colors shadow-sm"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>

              {/* Saree Box */}
              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-gold-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                    Handloom Weave Requested
                  </span>
                </div>

                <div className="text-sm font-bold text-charcoal-900 mb-1">
                  {selectedEnquiry.sareeTitle}
                </div>
                <div className="text-sm font-semibold text-gold-800 mb-2">
                  {selectedEnquiry.sareePrice}
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-sand-200 text-xs text-charcoal-600 italic">
                  "{selectedEnquiry.message || '-'}"
                </div>
              </div>
            </div>

            {/* Status Progression Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
                Inquiry Pipeline Status
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['new', 'contacted', 'confirmed', 'closed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold capitalize transition-all border ${
                      selectedEnquiry.status === st
                        ? 'bg-gold-600 text-white border-gold-600 shadow-sm'
                        : 'bg-white border-sand-300 text-charcoal-700 hover:bg-sand-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Internal CRM Staff Notes */}
            <div className="space-y-3 pt-2 border-t border-sand-200">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block">
                Internal Concierge Notes ({selectedEnquiry.notes?.length || 0})
              </span>

              {/* Note input form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record call summary, studio viewing time, loom timeline..."
                  className="flex-1 rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900 focus:border-gold-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Append Note
                </button>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedEnquiry.notes || []).map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-charcoal-400 mb-1">
                      <span className="font-semibold text-gold-900">{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-charcoal-700 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
