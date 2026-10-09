import { useState } from 'react';
import type { Category, Toast } from '../../types';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { AdminRowAction } from '../../../components/AdminUI';

interface CategoriesTabProps {
  categories: Category[];
  onAdd: (name: string, description: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  addToast: (msg: string, type: Toast['type']) => void;
}
interface FormState { name: string; description: string; }
interface Errors { name?: string; }

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Category name is required.';
  return e;
}

const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#9CA3AF] outline-none focus:ring-1 focus:ring-[#7C3AED] transition-colors";
const inputStyle = { backgroundColor: 'var(--color-ink)', border: '1px solid #374151' };

function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  readOnlyId,
}: {
  initial: FormState;
  onSubmit: (f: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
  readOnlyId?: string;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {readOnlyId && (
        <div className="mb-4 p-2.5 rounded-lg text-xs font-mono" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', color: '#8B5CF6' }}>
          {readOnlyId}
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="cat-name" className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
          Category Name <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          id="cat-name"
          type="text"
          value={form.name}
          onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors({}); }}
          placeholder="e.g. Movies"
          className={inputClass}
          style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : '#374151' }}
        />
        {errors.name && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.name}</p>}
      </div>
      <div className="mb-6">
        <label htmlFor="cat-desc" className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Description</label>
        <textarea
          id="cat-desc"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Brief description..."
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </div>
      <div className="flex justify-end gap-3" style={{ borderTop: '1px solid #374151', paddingTop: '1.25rem' }}>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}>Cancel</button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          {submitLabel.startsWith('Add ') && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesTab({ categories, onAdd, onEdit, onDelete, addToast }: CategoriesTabProps) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  const editItem = editId ? categories.find((c) => c.id === editId) : null;
  const deleteItem = deleteId ? categories.find((c) => c.id === deleteId) : null;
  const viewItem = viewId ? categories.find((c) => c.id === viewId) : null;
  const inUse = deleteItem && deleteItem.contentCount > 0;

  const thStyle: React.CSSProperties = { color: '#9CA3AF', padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ backgroundColor: '#150D2A', border: '1px solid #374151', color: '#fff' }}
          />
        </div>
        <button onClick={() => setSearch('')} className="px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}>Reset Search</button>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Category
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
        <table className="w-full border-collapse text-sm" style={{ backgroundColor: '#150D2A' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              <th style={thStyle}>Category ID</th>
              <th style={thStyle}>Category Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Content Count</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>
                {categories.length === 0 ? 'No categories have been created yet.' : 'No records match your search.'}
              </td></tr>
            )}
            {filtered.map((cat) => (
              <tr
                key={cat.id}
                style={{ borderBottom: '1px solid #1F2937' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124, 58, 237, 0.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <td className="px-3 py-3"><span className="font-mono text-xs" style={{ color: '#8B5CF6' }}>{cat.id}</span></td>
                <td className="px-3 py-3 font-medium text-white">{cat.name}</td>
                <td className="px-3 py-3 max-w-xs" style={{ color: '#9CA3AF' }}><span className="truncate block">{cat.description || '—'}</span></td>
                <td className="px-3 py-3">
                  <span className="font-semibold" style={{ color: '#F5A800' }}>{cat.contentCount}</span>
                  <span className="ml-1 text-xs" style={{ color: '#9CA3AF' }}>items</span>
                </td>
                <td className="px-3 py-3">
                  <div className="content-table__actions">
                    <AdminRowAction action="view" name={cat.name || `category ${cat.id}`} onClick={() => setViewId(cat.id)} />
                    <AdminRowAction action="edit" name={cat.name || `category ${cat.id}`} onClick={() => setEditId(cat.id)} />
                    <AdminRowAction action="delete" name={cat.name || `category ${cat.id}`} onClick={() => setDeleteId(cat.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewItem && (
        <Modal title="Category Details" onClose={() => setViewId(null)}>
          <div className="space-y-4">
            <Row label="Category ID" value={viewItem.id} mono />
            <Row label="Name" value={viewItem.name} />
            <Row label="Description" value={viewItem.description || '—'} />
            <Row label="Content Count" value={`${viewItem.contentCount} items`} />
          </div>
          <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid #374151' }}>
            <button onClick={() => { setViewId(null); setEditId(viewItem.id); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}>Edit</button>
          </div>
        </Modal>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Category" onClose={() => setShowAdd(false)}>
          <CategoryForm
            initial={{ name: '', description: '' }}
            submitLabel="Add Category"
            onCancel={() => setShowAdd(false)}
            onSubmit={(f) => { onAdd(f.name, f.description); setShowAdd(false); addToast('Category added.', 'success'); }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title="Edit Category" onClose={() => setEditId(null)}>
          <CategoryForm
            initial={{ name: editItem.name, description: editItem.description }}
            submitLabel="Save Changes"
            readOnlyId={editItem.id}
            onCancel={() => setEditId(null)}
            onSubmit={(f) => { onEdit({ ...editItem, name: f.name, description: f.description }); setEditId(null); addToast('Category updated.', 'success'); }}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteItem && (
        inUse ? (
          <Modal title="Cannot Delete Category" onClose={() => setDeleteId(null)}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245, 168, 0, 0.1)' }}>
                <svg className="w-4 h-4" style={{ color: '#F5A800' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                <strong className="text-white">"{deleteItem.name}"</strong> is currently assigned to {deleteItem.contentCount} content item{deleteItem.contentCount !== 1 ? 's' : ''}. Reassign the affected content before deleting it.
              </p>
            </div>
            <div className="flex justify-end pt-4" style={{ borderTop: '1px solid #374151' }}>
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}>Got it</button>
            </div>
          </Modal>
        ) : (
          <ConfirmDialog
            title="Delete Category?"
            message={`Are you sure you want to delete "${deleteItem.name}"? This action cannot be undone.`}
            confirmLabel="Delete Category"
            onConfirm={() => { onDelete(deleteItem.id); setDeleteId(null); addToast('Category deleted.', 'success'); }}
            onCancel={() => setDeleteId(null)}
          />
        )
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : 'font-medium'} text-white`}>{value}</p>
    </div>
  );
}
