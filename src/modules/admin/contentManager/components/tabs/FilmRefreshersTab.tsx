import { useState, useMemo } from 'react';
import type { FilmRefresher, Content, Toast } from '../../types';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { AdminRowAction } from '../../../components/AdminUI';

interface FilmRefreshersTabProps {
  refreshers: FilmRefresher[];
  content: Content[];
  onAdd: (r: Omit<FilmRefresher, 'id' | 'lastUpdated'>) => void;
  onEdit: (r: FilmRefresher) => void;
  onDelete: (id: string) => void;
  addToast: (msg: string, type: Toast['type']) => void;
}

const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#9CA3AF] outline-none focus:ring-1 focus:ring-[#7C3AED] transition-colors";
const inputStyle = { backgroundColor: 'var(--color-ink)', border: '1px solid #374151' };

type RForm = Omit<FilmRefresher, 'id' | 'lastUpdated'>;
const emptyForm: RForm = { contentId: '', title: '', summary: '', videoFilename: '', availability: 'available' };
type RErrors = Partial<Record<keyof RForm, string>>;

function validateR(f: RForm): RErrors {
  const e: RErrors = {};
  if (!f.contentId) e.contentId = 'Associated content is required.';
  if (!f.title.trim()) e.title = 'Refresher title is required.';
  if (!f.summary.trim()) e.summary = 'Summary is required.';
  return e;
}

function RefresherForm({
  initial, content, onSubmit, onCancel, submitLabel, readOnlyId,
}: {
  initial: RForm; content: Content[]; onSubmit: (f: RForm) => void; onCancel: () => void; submitLabel: string; readOnlyId?: string;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<RErrors>({});
  const [summaryLen, setSummaryLen] = useState(initial.summary.length);
  const set = <K extends keyof RForm>(k: K, v: RForm[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateR(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {readOnlyId && <div className="mb-4 p-2.5 rounded-lg text-xs font-mono" style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#8B5CF6' }}>{readOnlyId}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label htmlFor="rf-cnt" className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Associated Content <span style={{ color: '#EF4444' }}>*</span></label>
          <select id="rf-cnt" value={form.contentId} onChange={(e) => set('contentId', e.target.value)} className={inputClass} style={{ ...inputStyle, borderColor: errors.contentId ? '#EF4444' : '#374151' }}>
            <option value="">Select content</option>
            {content.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.id})</option>)}
          </select>
          {errors.contentId && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.contentId}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="rf-title" className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Refresher Title <span style={{ color: '#EF4444' }}>*</span></label>
          <input id="rf-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Neon Horizon: Story So Far" className={inputClass} style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : '#374151' }} />
          {errors.title && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.title}</p>}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label htmlFor="rf-summary" className="block text-xs font-medium" style={{ color: '#9CA3AF' }}>Text Summary <span style={{ color: '#EF4444' }}>*</span></label>
          <span className="text-xs" style={{ color: summaryLen > 2000 ? '#EF4444' : '#9CA3AF' }}>{summaryLen}/2000</span>
        </div>
        <textarea id="rf-summary" rows={5} value={form.summary} maxLength={2000} onChange={(e) => { set('summary', e.target.value); setSummaryLen(e.target.value.length); }} placeholder="Write a summary that helps viewers remember the story..." className={`${inputClass} resize-none`} style={{ ...inputStyle, borderColor: errors.summary ? '#EF4444' : '#374151' }} />
        {errors.summary && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.summary}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="rf-video" className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Refresher Video Filename</label>
        <input id="rf-video" type="text" value={form.videoFilename} onChange={(e) => set('videoFilename', e.target.value)} placeholder="refresher-video.mp4" className={inputClass} style={inputStyle} />
        {form.videoFilename && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg className="w-4 h-4" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs font-mono" style={{ color: '#C4B5FD' }}>{form.videoFilename}</span>
          </div>
        )}
      </div>
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Availability</label>
        <div className="flex gap-4">
          {(['available', 'unavailable'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="rf-avail" value={v} checked={form.availability === v} onChange={() => set('availability', v)} className="sr-only" />
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors" style={{ borderColor: form.availability === v ? '#7C3AED' : '#374151' }}>
                {form.availability === v && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />}
              </div>
              <span className="text-sm capitalize" style={{ color: form.availability === v ? '#fff' : '#9CA3AF' }}>{v}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3" style={{ borderTop: '1px solid #374151', paddingTop: '1.25rem' }}>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}>Cancel</button>
        <button type="submit" className="btn-primary flex items-center gap-2 px-5 py-2.5">
          {submitLabel.startsWith('Add ') && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function FilmRefreshersTab({ refreshers, content, onAdd, onEdit, onDelete, addToast }: FilmRefreshersTabProps) {
  const [search, setSearch] = useState('');
  const [contentFilter, setContentFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = refreshers;
    if (search) rows = rows.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.summary.toLowerCase().includes(search.toLowerCase()));
    if (contentFilter) rows = rows.filter((r) => r.contentId === contentFilter);
    return rows;
  }, [refreshers, search, contentFilter]);

  const editItem = editId ? refreshers.find((r) => r.id === editId) : null;
  const deleteItem = deleteId ? refreshers.find((r) => r.id === deleteId) : null;
  const viewItem = viewId ? refreshers.find((r) => r.id === viewId) : null;
  const getTitle = (id: string) => content.find((c) => c.id === id)?.title ?? id;

  const thStyle: React.CSSProperties = { color: '#9CA3AF', padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div>
      <div className="content-admin-tab-toolbar flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search film refreshers..." aria-label="Search film refreshers" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none" style={{ backgroundColor: '#150D2A', border: '1px solid #374151', color: '#fff' }} />
        </div>
        <select value={contentFilter} onChange={(e) => setContentFilter(e.target.value)} className="content-command-bar__select" aria-label="Filter by content">
          <option value="">All Content</option>
          {content.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setContentFilter(''); }} className="btn-violet focus-ring admin-reset-filters">Reset Filters</button>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Film Refresher
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
        <div className="content-media-table-scroll">
          <table className="content-media-table content-refreshers-table border-collapse text-sm" style={{ backgroundColor: '#150D2A' }}>
            <colgroup>
              <col className="media-col-id" /><col className="media-col-title" /><col className="media-col-content" /><col className="media-col-summary" />
              <col className="media-col-video" /><col className="media-col-updated" /><col className="media-col-status" /><col className="media-col-actions" />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={thStyle}>Refresher ID</th>
                <th style={thStyle}>Refresher Title</th>
                <th style={thStyle}>Associated Content</th>
                <th style={thStyle}>Summary</th>
                <th style={thStyle}>Video</th>
                <th style={thStyle}>Last Updated</th>
                <th style={thStyle}>Availability</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>
                  {refreshers.length === 0 ? 'No Film Refreshers have been added yet.' : 'No records match your search or selected filters.'}
                </td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1F2937' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124,58,237,0.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                  <td className="px-3 py-3"><span className="block truncate font-mono text-xs" title={r.id} style={{ color: '#8B5CF6' }}>{r.id}</span></td>
                  <td className="px-3 py-3 font-medium text-white"><span className="truncate block" title={r.title}>{r.title}</span></td>
                  <td className="px-3 py-3"><span className="truncate block text-white" title={getTitle(r.contentId)}>{getTitle(r.contentId)}</span></td>
                  <td className="px-3 py-3" style={{ color: '#9CA3AF' }}>
                    <span className="line-clamp-2 text-xs leading-relaxed" title={r.summary}>{r.summary.slice(0, 100)}{r.summary.length > 100 ? '…' : ''}</span>
                  </td>
                  <td className="px-3 py-3">
                    {r.videoFilename ? (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#A78BFA' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Video
                      </span>
                    ) : <span style={{ color: '#374151' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#9CA3AF' }}>{r.lastUpdated}</td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium" style={{ backgroundColor: r.availability === 'available' ? 'rgba(16,185,129,.1)' : 'rgba(107,114,128,.15)', borderColor: r.availability === 'available' ? 'rgba(16,185,129,.35)' : 'rgba(107,114,128,.4)', color: r.availability === 'available' ? '#6EE7B7' : '#D1D5DB' }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.availability === 'available' ? '#10B981' : '#6B7280' }} aria-hidden="true" />{r.availability === 'available' ? 'Available' : 'Unavailable'}</span></td>
                  <td className="px-3 py-3">
                    <div className="content-table__actions">
                      <AdminRowAction action="view" name={r.title || `refresher ${r.id}`} onClick={() => setViewId(r.id)} />
                      <AdminRowAction action="edit" name={r.title || `refresher ${r.id}`} onClick={() => setEditId(r.id)} />
                      <AdminRowAction action="delete" name={r.title || `refresher ${r.id}`} onClick={() => setDeleteId(r.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewItem && (
        <Modal title="Film Refresher Details" onClose={() => setViewId(null)} wide>
          <div className="space-y-4">
            <div><p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Refresher ID</p><p className="text-sm font-mono text-white">{viewItem.id}</p></div>
            <div><p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Title</p><p className="text-sm font-medium text-white">{viewItem.title}</p></div>
            <div><p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Associated Content</p><p className="text-sm font-medium text-white">{getTitle(viewItem.contentId)}</p></div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>{viewItem.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Video</p><p className="text-sm font-mono text-white">{viewItem.videoFilename || '—'}</p></div>
              <div><p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Last Updated</p><p className="text-sm text-white">{viewItem.lastUpdated}</p></div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Availability</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: viewItem.availability === 'available' ? 'rgba(124,58,237,0.15)' : 'rgba(55,65,81,0.4)', border: `1px solid ${viewItem.availability === 'available' ? 'rgba(124,58,237,0.4)' : '#374151'}`, color: viewItem.availability === 'available' ? '#A78BFA' : '#9CA3AF' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: viewItem.availability === 'available' ? '#7C3AED' : '#6B7280' }} aria-hidden="true" />
                  {viewItem.availability === 'available' ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid #374151' }}>
            <button onClick={() => { setViewId(null); setEditId(viewItem.id); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}>Edit</button>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add Film Refresher" onClose={() => setShowAdd(false)} wide>
          <RefresherForm initial={emptyForm} content={content} submitLabel="Add Film Refresher" onCancel={() => setShowAdd(false)}
            onSubmit={(f) => { onAdd(f); setShowAdd(false); addToast('Film Refresher added.', 'success'); }} />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Film Refresher" onClose={() => setEditId(null)} wide>
          <RefresherForm initial={{ contentId: editItem.contentId, title: editItem.title, summary: editItem.summary, videoFilename: editItem.videoFilename, availability: editItem.availability }}
            content={content} submitLabel="Save Changes" readOnlyId={editItem.id} onCancel={() => setEditId(null)}
            onSubmit={(f) => { onEdit({ ...editItem, ...f, lastUpdated: new Date().toISOString().split('T')[0] }); setEditId(null); addToast('Film Refresher updated.', 'success'); }} />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog title="Delete Film Refresher?" message={`Are you sure you want to delete "${deleteItem.title}"? This action cannot be undone.`}
          confirmLabel="Delete Film Refresher" onConfirm={() => { onDelete(deleteItem.id); setDeleteId(null); addToast('Film Refresher deleted.', 'success'); }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}
