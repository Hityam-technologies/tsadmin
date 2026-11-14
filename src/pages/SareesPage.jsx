import React, { useState, useEffect, useCallback } from 'react';
import { sareeService } from '../services/sareeService';
import { categoryService } from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { dash } from '../lib/utils';
import {
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

function imageUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

function sareePayload(formData) {
  const images = (formData.images || []).map(imageUrl).filter(Boolean);
  const slug = formData.slug
    || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const numericPrice = Number(formData.numericPrice);
  const numericMrp = Number(formData.numericMrp);
  return {
    title: formData.title,
    brand: formData.brand || undefined,
    slug,
    category: formData.category || undefined,
    numericPrice: Number.isFinite(numericPrice) ? numericPrice : undefined,
    numericMrp: Number.isFinite(numericMrp) ? numericMrp : undefined,
    weave: formData.weave || '',
    fabric: formData.fabric || '',
    zari: formData.zari || '',
    origin: formData.origin || '',
    colorTheme: formData.colorTheme || '',
    description: formData.description || '',
    productCode: formData.productCode || '',
    codeParts: formData.codeParts || '',
    collectionLine: formData.collectionLine || '',
    body: formData.body || '',
    border: formData.border || '',
    pallu: formData.pallu || '',
    blouse: formData.blouse || '',
    bookingTitle: formData.bookingTitle || '',
    codeLegend: formData.codeLegend || '',
    footerLine: formData.footerLine || '',
    stock: formData.stock || undefined,
    stockQuantity:
      formData.stockQuantity === '' || formData.stockQuantity == null
        ? undefined
        : Number(formData.stockQuantity),
    images,
    image: images[0] || imageUrl(formData.image) || undefined,
    tryOnImage: imageUrl(formData.tryOnImage) || images[0] || undefined,
    isFeatured: Boolean(formData.isFeatured),
    isActive: formData.isActive !== false,
  };
}

export function SareesPage() {
  const { showToast } = useToast();

  const [sarees, setSarees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Create / Edit Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSaree, setEditingSaree] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    slug: '',
    category: '',
    numericPrice: '',
    numericMrp: '',
    weave: '',
    fabric: '',
    zari: '',
    origin: '',
    colorTheme: '',
    description: '',
    productCode: '',
    codeParts: '',
    collectionLine: '',
    body: '',
    border: '',
    pallu: '',
    blouse: '',
    bookingTitle: '',
    codeLegend: '',
    footerLine: '',
    stock: 'In Stock',
    stockQuantity: 3,
    isFeatured: false,
    isActive: true,
    images: [],
    image: '',
    tryOnImage: '',
  });

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Image URL input inside uploader
  const [newImageUrl, setNewImageUrl] = useState('');

  // Fetch Sarees
  const fetchSarees = useCallback(async () => {
    setLoading(true);
    const res = await sareeService.getSarees({
      page,
      search,
      category: categoryFilter,
      stockFilter,
      status: statusFilter,
      sortBy,
      limit: 8,
    });
    if (res.success) {
      setSarees(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [page, search, categoryFilter, stockFilter, statusFilter, sortBy]);

  // Initial load
  useEffect(() => {
    fetchSarees();
  }, [fetchSarees]);

  useEffect(() => {
    async function loadCategories() {
      const res = await categoryService.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    }
    loadCategories();
  }, []);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(sarees.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    const res = await sareeService.bulkAction(selectedIds, action);
    if (res.success) {
      showToast(`Successfully performed ${action} on ${selectedIds.length} sarees`, 'success');
      setSelectedIds([]);
      fetchSarees();
    }
    setIsSubmitting(false);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingSaree(null);
    setFormData({
      title: '',
      brand: '',
      slug: '',
      category: categories[0]?.id || '',
      numericPrice: '',
      numericMrp: '',
      weave: '',
      fabric: '',
      zari: '',
      origin: '',
      colorTheme: '',
      description: '',
      productCode: '',
      codeParts: '',
      collectionLine: '',
      body: '',
      border: '',
      pallu: '',
      blouse: '',
      bookingTitle: '',
      codeLegend: '',
      footerLine: '',
      stock: '',
      stockQuantity: '',
      isFeatured: false,
      isActive: true,
      images: [],
      image: '',
      tryOnImage: '',
    });
    setNewImageUrl('');
    setIsEditorOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (saree) => {
    setEditingSaree(saree);
    const images = (saree.images || []).map(imageUrl).filter(Boolean);
    setFormData({
      ...saree,
      numericPrice: saree.numericPrice ?? '',
      numericMrp: saree.numericMrp ?? '',
      images: images.length ? images : [imageUrl(saree.image)].filter(Boolean),
      image: imageUrl(saree.image),
      tryOnImage: imageUrl(saree.tryOnImage),
    });
    setNewImageUrl('');
    setIsEditorOpen(true);
  };

  // Duplicate Saree
  const handleDuplicate = async (saree) => {
    const res = await sareeService.duplicateSaree(saree.id);
    if (res.success) {
      showToast(`Cloned saree listing: ${res.data.title}`, 'success');
      fetchSarees();
    }
  };

  // Delete Saree Confirmation
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    const res = await sareeService.deleteSaree(deleteTargetId);
    if (res.success) {
      showToast('Saree listing removed from catalog', 'success');
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
      fetchSarees();
    }
    setIsSubmitting(false);
  };

  // Form Save
  const handleSaveSaree = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a saree title', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload = sareePayload(formData);

    if (editingSaree) {
      const res = await sareeService.updateSaree(editingSaree.id, payload);
      if (res.success) {
        showToast('Updated saree details successfully', 'success');
        setIsEditorOpen(false);
        fetchSarees();
      } else {
        showToast(res.error?.message || 'The saree could not be updated.', 'error');
      }
    } else {
      const res = await sareeService.createSaree(payload);
      if (res.success) {
        showToast('New handloom drape created successfully', 'success');
        setIsEditorOpen(false);
        fetchSarees();
      } else {
        showToast(res.error?.message || 'The saree could not be created.', 'error');
      }
    }
    setIsSubmitting(false);
  };

  // Image Reordering & Primary Selection Handlers
  const moveImage = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= formData.images.length) return;
    const reordered = [...formData.images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    setFormData({
      ...formData,
      images: reordered,
      image: reordered[0],
    });
  };

  const removeImage = (index) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: updated,
      image: updated[0] || '',
    });
  };

  const setAsPrimaryImage = (index) => {
    if (index === 0) return;
    const reordered = [...formData.images];
    const [primary] = reordered.splice(index, 1);
    reordered.unshift(primary);
    setFormData({
      ...formData,
      images: reordered,
      image: reordered[0],
    });
    showToast('Cover thumbnail updated', 'info');
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const updated = [...formData.images, newImageUrl.trim()];
    setFormData({
      ...formData,
      images: updated,
      image: formData.image || newImageUrl.trim(),
    });
    setNewImageUrl('');
    showToast('Image appended to gallery', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
            Catalog Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Master Saree Collections
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            Each saree is a photo, a code, a story, and the body, border, pallu, and blouse lines.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-charcoal-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" /> Add New Saree
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-charcoal-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title or product code..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-sand-300 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-charcoal-900 placeholder:text-charcoal-400 font-medium"
            />
          </div>

          {/* Active / Inactive Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-sand-300 text-charcoal-800 bg-white focus:border-gold-500 font-medium"
            >
              <option value="all">Active & Inactive</option>
              <option value="active">Active Published Only</option>
              <option value="inactive">Inactive / Drafts Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-sand-300 text-charcoal-800 bg-white focus:border-gold-500 font-medium"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="title_asc">Title: A to Z</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gold-50 rounded-xl border border-gold-200 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-gold-900">
              <Sparkles className="w-4 h-4 text-gold-700" />
              <span>{selectedIds.length} sarees selected for batch processing</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-gold-300 text-xs font-medium text-gold-900 hover:bg-gold-100 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-sand-300 text-xs font-medium text-charcoal-700 hover:bg-sand-100 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('feature')}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
              >
                Mark Featured
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 rounded-lg bg-maroon-600 text-xs font-medium text-white hover:bg-maroon-700 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-charcoal-500 hover:text-charcoal-800"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : sarees.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No sarees match your filter criteria"
            description="Adjust your search parameters, category filters, or add a new luxury handloom creation to this view."
            action={
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-600 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Saree
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-sand-50/80 border-b border-sand-200 text-charcoal-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sarees.length && sarees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
                    />
                  </th>
                  <th className="py-3.5 px-3">Saree</th>
                  <th className="py-3.5 px-3">Code</th>
                  <th className="py-3.5 px-3 text-center">Active</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-charcoal-800">
                {sarees.map((saree) => {
                  const isChecked = selectedIds.includes(saree.id);
                  return (
                    <tr
                      key={saree.id}
                      className={`hover:bg-sand-50/50 transition-colors ${
                        isChecked ? 'bg-gold-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-6 pr-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(saree.id)}
                          className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
                        />
                      </td>

                      {/* Thumbnail & Title */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {saree.image ? (
                            <img
                              src={saree.image}
                              alt={saree.title || '-'}
                              className="w-11 h-14 rounded-lg object-cover ring-1 ring-sand-300 flex-shrink-0"
                            />
                          ) : (
                            <span className="w-11 h-14 rounded-lg ring-1 ring-sand-300 flex items-center justify-center text-charcoal-400 flex-shrink-0">-</span>
                          )}
                          <div>
                            <span className="font-semibold text-charcoal-900 line-clamp-1">
                              {dash(saree.title)}
                            </span>
                            <span className="text-[11px] text-charcoal-500 block">
                              {dash(saree.collectionLine)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-charcoal-900">{dash(saree.productCode)}</div>
                        <span className="text-[10px] text-charcoal-400 block">{dash(saree.codeParts)}</span>
                      </td>

                      {/* Published while stock remains. A sold-out saree is not shown as active. */}
                      <td className="py-3.5 px-3 text-center">
                        {Number(saree.stockQuantity) <= 0 || saree.stock === 'Out of Stock' ? (
                          <span className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-charcoal-500">
                            Sold out
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              sareeService
                                .updateSaree(saree.id, { isActive: !saree.isActive })
                                .then(() => fetchSarees())
                            }
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors inline-block ${
                              saree.isActive ? 'bg-gold-600' : 'bg-sand-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                saree.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(saree)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-700 hover:bg-gold-50 transition-colors"
                            title="Edit Saree Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(saree)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-sand-100 transition-colors"
                            title="Duplicate / Clone"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(saree.id)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-maroon-600 hover:bg-maroon-50 transition-colors"
                            title="Delete Saree"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={8}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Saree Create / Edit Form Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingSaree ? `Edit Saree: ${editingSaree.title}` : 'Catalog New Heirloom Saree'}
        subtitle="Photo, code, story, and the body, border, pallu, and blouse lines."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveSaree} className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Saree title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Dark Brown • Gold Leaf Gap Border Saree"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
            />
          </div>

          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 block">
              Catalogue card
            </span>
            <p className="text-[11px] text-charcoal-500">
              These lines change per saree. The order WhatsApp number is the shop support number, shared by every saree.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Product code</label>
                <input type="text" value={formData.productCode || ''} onChange={(e) => setFormData({ ...formData, productCode: e.target.value })} placeholder="TSDBGBSR" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Code parts</label>
                <input type="text" value={formData.codeParts || ''} onChange={(e) => setFormData({ ...formData, codeParts: e.target.value })} placeholder="TS • DB • GB • SR" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Collection line</label>
                <input type="text" value={formData.collectionLine || ''} onChange={(e) => setFormData({ ...formData, collectionLine: e.target.value })} placeholder="HERITAGE • ELEGANCE • HANDLOOM" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Story</label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dark as midnight earth, bright as temple gold..."
                className="w-full rounded-lg border border-sand-300 p-2 text-xs bg-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['body', 'Body', 'Dark brown with large gold leaf / paisley buttas'],
                ['border', 'Border', 'Gap Border — thin elegant gold zari lines with gap'],
                ['pallu', 'Pallu', 'Rich gold geometric checks + gold border + black tassels'],
                ['blouse', 'Blouse', 'Dark brown with gold gap border'],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block text-[11px] font-medium text-charcoal-700 mb-1">{label}</label>
                  <input type="text" value={formData[key] || ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} placeholder={placeholder} className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Booking line</label>
              <input type="text" value={formData.bookingTitle || ''} onChange={(e) => setFormData({ ...formData, bookingTitle: e.target.value })} placeholder="Heritage Saree — Sangrahah Collection" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Code meaning</label>
              <input type="text" value={formData.codeLegend || ''} onChange={(e) => setFormData({ ...formData, codeLegend: e.target.value })} placeholder="Tripuraa Sangrahah • Dark Brown • Gap Border • Saree" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-charcoal-700 mb-1">Footer line</label>
              <input type="text" value={formData.footerLine || ''} onChange={(e) => setFormData({ ...formData, footerLine: e.target.value })} placeholder="Tripuraa Sangrahah • Heritage Sarees • Custom Lehenga for Girls" className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs bg-white" />
            </div>
          </div>

          {/* Product photo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">
                  Product Gallery & Reordering
                </span>
                <span className="text-[11px] text-charcoal-500">
                  First photo is the default catalog thumbnail. Use arrows to reorder gallery sequence.
                </span>
              </div>
            </div>

            {/* Image Preview Grid with Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formData.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`relative group rounded-xl overflow-hidden border p-1 bg-white shadow-sm transition-all ${
                    idx === 0 ? 'border-gold-500 ring-2 ring-gold-400' : 'border-sand-300'
                  }`}
                >
                  {imageUrl(imgUrl) ? (
                    <img src={imageUrl(imgUrl)} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <span className="w-full h-32 rounded-lg bg-sand-100 flex items-center justify-center text-charcoal-400">-</span>
                  )}

                  {/* Primary Badge */}
                  {idx === 0 ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gold-600 text-white font-semibold text-[10px] shadow">
                      Cover Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsPrimaryImage(idx)}
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white hover:bg-gold-600 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Make Primary
                    </button>
                  )}

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-sand-100 disabled:opacity-30 text-charcoal-600"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === formData.images.length - 1}
                        className="p-1 rounded hover:bg-sand-100 disabled:opacity-30 text-charcoal-600"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded hover:bg-maroon-50 text-maroon-600"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Image URL Row */}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste high-res image URL (e.g. Unsplash or CDN asset)..."
                className="flex-1 rounded-xl border border-sand-300 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-3.5 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-charcoal-800 text-xs font-medium transition-colors"
              >
                Append Image
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
              />
              <span className="text-xs font-medium text-charcoal-800">
                Publish to Live Customer Catalog
              </span>
            </label>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="px-4 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700 hover:bg-sand-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {isSubmitting ? 'Saving Weave...' : editingSaree ? 'Update Saree' : 'Save Saree'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Saree From Catalog"
        description="Are you sure you wish to delete this master handloom listing? It will no longer be visible on mobile apps or in collections."
        confirmText="Confirm Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
}
