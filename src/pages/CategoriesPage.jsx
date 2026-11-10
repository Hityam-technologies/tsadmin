import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Plus, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import { dash } from '../lib/utils';

export function CategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);

  // Editor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
  });

  // Delete
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    const res = await categoryService.getCategories();
    if (res.success) {
      setCategories(res.data);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      label: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      label: category.label,
      slug: category.slug,
      description: category.description || '',
      image: category.image,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      showToast('Please enter category name', 'error');
      return;
    }

    setIsSubmitting(true);
    const slug =
      formData.slug ||
      formData.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const payload = { ...formData, slug };

    if (editingCategory) {
      const res = await categoryService.updateCategory(editingCategory.id, payload);
      if (res.success) {
        showToast('Category updated successfully', 'success');
        setIsModalOpen(false);
        loadCategories();
      }
    } else {
      const res = await categoryService.createCategory(payload);
      if (res.success) {
        showToast('New category created', 'success');
        setIsModalOpen(false);
        loadCategories();
      }
    }
    setIsSubmitting(false);
  };

  const handleReorder = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const list = [...categories];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const orderedIds = list.map((c) => c.id);
    const res = await categoryService.reorderCategories(orderedIds);
    if (res.success) {
      setCategories(res.data);
      showToast('Story bar display sequence updated', 'info');
    }
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    const res = await categoryService.deleteCategory(deleteTargetId);
    if (res.success) {
      showToast('Category deleted', 'success');
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
      loadCategories();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
            Navigation & Stories
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Category Stories & Collections
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            Controls the circular story bar on mobile Home and horizontal tabs across Collections.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-charcoal-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" /> Add Category
        </button>
      </div>

      {/* Category List Cards */}
      <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] divide-y divide-sand-200 overflow-hidden">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sand-50/40 transition-colors"
          >
            {/* Left: Thumbnail & Details */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleReorder(index, -1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-sand-100 disabled:opacity-20 text-charcoal-500"
                  title="Move story left / up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(index, 1)}
                  disabled={index === categories.length - 1}
                  className="p-1 rounded hover:bg-sand-100 disabled:opacity-20 text-charcoal-500"
                  title="Move story right / down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Story Circular Avatar */}
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-gold-500 to-saffron-500 flex-shrink-0">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.label || '-'}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <span className="w-full h-full rounded-full bg-white border-2 border-white flex items-center justify-center text-charcoal-400">-</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-sm text-charcoal-900">
                    {dash(category.label)}
                  </h3>
                  <Badge variant={category.isActive ? 'gold' : 'default'} size="xs">
                    {category.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                  <span className="text-[10px] text-charcoal-400 font-mono">
                    /{category.slug}
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 line-clamp-1 mt-0.5">
                  {category.description || '-'}
                </p>
                <span className="text-[11px] text-gold-700 font-medium">
                  Order Index: #{category.order} &bull; {category.itemCount || 0} Weaves Listed
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Active Toggle */}
              <button
                type="button"
                onClick={() =>
                  categoryService
                    .updateCategory(category.id, { isActive: !category.isActive })
                    .then(() => loadCategories())
                }
                className={`w-9 h-5 rounded-full p-0.5 transition-colors inline-block ${
                  category.isActive ? 'bg-gold-600' : 'bg-sand-300'
                }`}
                title="Toggle Mobile Visibility"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    category.isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              <button
                onClick={() => handleOpenEdit(category)}
                className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-700 hover:bg-gold-50"
                title="Edit Category"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(category.id)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-maroon-600 hover:bg-maroon-50"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.label}` : 'Create Collection Category'}
        subtitle="This category appears as an Instagram-style story icon on the customer app home screen."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              placeholder="e.g. Kanchipuram"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Slug Identifier
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="kanchipuram"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Cover Story Image URL *
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Short Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-sand-300 p-2 text-xs focus:border-gold-500"
              placeholder="Pure silk drapes woven on traditional pit looms..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
            />
            <label htmlFor="catActive" className="text-xs font-medium text-charcoal-800">
              Active & Published on Mobile Story Bar
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700 hover:bg-sand-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you wish to delete this collection category? Saree listings will lose their primary story tag."
        confirmText="Confirm Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
}
