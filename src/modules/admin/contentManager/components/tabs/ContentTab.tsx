import { useState, useMemo, useEffect } from 'react';
import type { Content, Category, Genre, Toast } from '../../types';
import ConfirmDialog from '../shared/ConfirmDialog';
import Modal from '../shared/Modal';

interface ContentTabProps {
  content: Content[];
  categories: Category[];
  genres: Genre[];
  onAdd: (item: Omit<Content, 'id' | 'totalStreams'>) => void;
  onEdit: (item: Content) => void;
  onDelete: (id: string) => void;
  addToast: (msg: string, type: Toast['type']) => void;
}

const ROWS_PER_PAGE = 10;

const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'NR'];

function formatStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatRuntime(mins: number) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

const inputClass = `w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#9CA3AF] outline-none transition-colors duration-150 focus:ring-1`;
const inputStyle = {
  backgroundColor: 'var(--color-ink)',
  border: '1px solid #374151',
  '--focus-ring-color': '#7C3AED',
};

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{msg}</p> : null;
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
      {children}{required && <span className="ml-0.5" style={{ color: '#EF4444' }}>*</span>}
    </label>
  );
}

type FormData = Omit<Content, 'id' | 'totalStreams'>;
const emptyForm: FormData = {
  title: '', categoryId: '', genreIds: [], synopsis: '',
  releaseYear: new Date().getFullYear(), runtime: 90,
  ageRating: 'PG-13', thumbnailUrl: '', thumbnailFilename: '',
  videoFilename: '', subtitleFilename: '', availability: 'available',
};

type Errors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.title.trim()) errors.title = 'Title is required.';
  if (!data.categoryId) errors.categoryId = 'Category is required.';
  if (data.genreIds.length === 0) errors.genreIds = 'At least one genre is required.';
  if (!data.synopsis.trim()) errors.synopsis = 'Synopsis is required.';
  if (!data.releaseYear || data.releaseYear < 1888 || data.releaseYear > 2099) errors.releaseYear = 'Enter a valid year (1888–2099).';
  if (!data.runtime || data.runtime < 1) errors.runtime = 'Runtime must be at least 1 minute.';
  if (!data.ageRating) errors.ageRating = 'Age rating is required.';
  return errors;
}

function ContentForm({
  initial,
  categories,
  genres,
  onSubmit,
  onCancel,
  submitLabel,
  readOnlyId,
  readOnlyStreams,
  onDelete,
}: {
  initial: FormData;
  categories: Category[];
  genres: Genre[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitLabel: string;
  readOnlyId?: string;
  readOnlyStreams?: number;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [synopsisLen, setSynopsisLen] = useState(initial.synopsis.length);
  const [thumbPreview, setThumbPreview] = useState(initial.thumbnailUrl);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  }

  function toggleGenre(gid: string) {
    const ids = form.genreIds.includes(gid)
      ? form.genreIds.filter((id) => id !== gid)
      : [...form.genreIds, gid];
    set('genreIds', ids);
  }

  function handleThumbUrl(val: string) {
    set('thumbnailUrl', val);
    set('thumbnailFilename', val ? val.split('/').pop() || 'thumbnail.jpg' : '');
    setThumbPreview(val);
  }

  const btnPrimaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #F5A800, #FF6B00)',
    color: '#1a0a00',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full min-w-0">
      {readOnlyId && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg p-3" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Content ID</span>
          <span className="text-sm font-mono font-semibold" style={{ color: '#8B5CF6' }}>{readOnlyId}</span>
          {readOnlyStreams !== undefined && (
            <>
              <span className="w-px h-4 mx-1" style={{ backgroundColor: '#374151' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Total Streams</span>
              <span className="text-sm font-semibold" style={{ color: '#F5A800' }}>{readOnlyStreams.toLocaleString()}</span>
              <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>(read-only)</span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Title */}
        <div className="sm:col-span-2">
          <Label htmlFor="cnt-title" required>Title</Label>
          <input
            id="cnt-title"
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Enter content title"
            className={inputClass}
            style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : '#374151' }}
          />
          <FieldError msg={errors.title} />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="cnt-category" required>Category</Label>
          <select
            id="cnt-category"
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, borderColor: errors.categoryId ? '#EF4444' : '#374151' }}
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <FieldError msg={errors.categoryId} />
        </div>

        {/* Age Rating */}
        <div>
          <Label htmlFor="cnt-age" required>Age Rating</Label>
          <select
            id="cnt-age"
            value={form.ageRating}
            onChange={(e) => set('ageRating', e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, borderColor: errors.ageRating ? '#EF4444' : '#374151' }}
          >
            {AGE_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <FieldError msg={errors.ageRating} />
        </div>

        {/* Release Year */}
        <div>
          <Label htmlFor="cnt-year" required>Release Year</Label>
          <input
            id="cnt-year"
            type="number"
            min={1888}
            max={2099}
            value={form.releaseYear}
            onChange={(e) => set('releaseYear', parseInt(e.target.value) || 0)}
            className={inputClass}
            style={{ ...inputStyle, borderColor: errors.releaseYear ? '#EF4444' : '#374151' }}
          />
          <FieldError msg={errors.releaseYear} />
        </div>

        {/* Runtime */}
        <div>
          <Label htmlFor="cnt-runtime" required>Runtime (minutes)</Label>
          <input
            id="cnt-runtime"
            type="number"
            min={1}
            value={form.runtime}
            onChange={(e) => set('runtime', parseInt(e.target.value) || 0)}
            className={inputClass}
            style={{ ...inputStyle, borderColor: errors.runtime ? '#EF4444' : '#374151' }}
          />
          <FieldError msg={errors.runtime} />
        </div>
      </div>

      {/* Genres */}
      <div className="mb-4">
        <Label htmlFor="cnt-genres" required>Genres</Label>
        <div
          className="flex flex-wrap gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-ink)', border: `1px solid ${errors.genreIds ? '#EF4444' : '#374151'}` }}
          id="cnt-genres"
          role="group"
          aria-label="Genre selection"
        >
          {genres.map((g) => {
            const active = form.genreIds.includes(g.id);
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                aria-pressed={active}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: active ? 'rgba(124, 58, 237, 0.3)' : 'rgba(55, 65, 81, 0.4)',
                  border: `1px solid ${active ? '#7C3AED' : '#374151'}`,
                  color: active ? '#C4B5FD' : '#9CA3AF',
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.genreIds} />
      </div>

      {/* Synopsis */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="cnt-synopsis" required>Synopsis</Label>
          <span className="text-xs" style={{ color: synopsisLen > 1000 ? '#EF4444' : '#9CA3AF' }}>{synopsisLen}/1000</span>
        </div>
        <textarea
          id="cnt-synopsis"
          rows={4}
          value={form.synopsis}
          maxLength={1000}
          onChange={(e) => { set('synopsis', e.target.value); setSynopsisLen(e.target.value.length); }}
          placeholder="Enter synopsis..."
          className={`${inputClass} resize-none`}
          style={{ ...inputStyle, borderColor: errors.synopsis ? '#EF4444' : '#374151' }}
        />
        <FieldError msg={errors.synopsis} />
      </div>

      {/* Thumbnail */}
      <div className="mb-4">
        <Label htmlFor="cnt-thumb">Thumbnail URL</Label>
        <input
          id="cnt-thumb"
          type="url"
          value={form.thumbnailUrl}
          onChange={(e) => handleThumbUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
          style={inputStyle}
        />
        {thumbPreview && (
          <div className="mt-2">
            <img
              src={thumbPreview}
              alt="Thumbnail preview"
              className="h-20 rounded-lg object-cover"
              style={{ border: '1px solid #374151' }}
              onError={() => setThumbPreview('')}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Video File */}
        <div>
          <Label htmlFor="cnt-video">Video Filename</Label>
          <input
            id="cnt-video"
            type="text"
            value={form.videoFilename}
            onChange={(e) => set('videoFilename', e.target.value)}
            placeholder="filename.mp4"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        {/* Subtitle File */}
        <div>
          <Label htmlFor="cnt-sub">Subtitle Filename</Label>
          <input
            id="cnt-sub"
            type="text"
            value={form.subtitleFilename}
            onChange={(e) => set('subtitleFilename', e.target.value)}
            placeholder="filename.srt"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <Label htmlFor="cnt-avail" required>Availability</Label>
        <div className="flex flex-wrap gap-3">
          {(['available', 'unavailable'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                value={v}
                checked={form.availability === v}
                onChange={() => set('availability', v)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{ borderColor: form.availability === v ? '#7C3AED' : '#374151' }}
              >
                {form.availability === v && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />}
              </div>
              <span className="text-sm capitalize" style={{ color: form.availability === v ? '#fff' : '#9CA3AF' }}>{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid #374151', paddingTop: '1.25rem' }}>
        <div className="w-full sm:w-auto">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
            >
              Delete Content
            </button>
          )}
        </div>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto"
            style={{ backgroundColor: 'transparent', border: '1px solid #374151', color: '#9CA3AF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6B7280'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg px-5 py-2 text-sm sm:w-auto"
            style={btnPrimaryStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFB800, #FF8C00)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #F5A800, #FF6B00)'; }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function DetailDrawer({
  item,
  categories,
  genres,
  onClose,
  onEdit,
  onDelete,
}: {
  item: Content;
  categories: Category[];
  genres: Genre[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = categories.find((c) => c.id === item.categoryId);
  const itemGenres = genres.filter((g) => item.genreIds.includes(g.id));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      style={{ backgroundColor: 'rgba(11, 7, 25, 0.6)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg h-full flex flex-col overflow-hidden"
        style={{ backgroundColor: '#150D2A', borderLeft: '1px solid rgba(124, 58, 237, 0.3)' }}
        role="complementary"
        aria-label="Content details"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #374151' }}
        >
          <h2 className="text-base font-semibold text-white">Content Details</h2>
          <button onClick={onClose} aria-label="Close details" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: '#9CA3AF' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Thumbnail */}
          {item.thumbnailUrl && (
            <img
              src={item.thumbnailUrl}
              alt={`${item.title} thumbnail`}
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: 200, border: '1px solid #374151' }}
            />
          )}

          {/* IDs */}
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Content ID" value={item.id} mono />
            <DetailField label="Total Streams" value={item.totalStreams.toLocaleString()} note="(read-only)" />
          </div>

          <DetailField label="Title" value={item.title} />
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Category" value={cat?.name ?? '—'} />
            <DetailField label="Availability">
              <AvailBadge status={item.availability} />
            </DetailField>
          </div>

          {/* Genres */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: '#9CA3AF' }}>Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {itemGenres.map((g) => (
                <span key={g.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(124, 58, 237, 0.4)', color: '#C4B5FD' }}>{g.name}</span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: '#9CA3AF' }}>Synopsis</p>
            <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>{item.synopsis}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DetailField label="Release Year" value={item.releaseYear.toString()} />
            <DetailField label="Runtime" value={formatRuntime(item.runtime)} />
            <DetailField label="Age Rating" value={item.ageRating} />
          </div>

          <div className="space-y-2">
            <FileField label="Thumbnail" filename={item.thumbnailFilename} />
            <FileField label="Video" filename={item.videoFilename} />
            <FileField label="Subtitles" filename={item.subtitleFilename || '—'} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #374151' }}
        >
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6B7280'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFB800, #FF8C00)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #F5A800, #FF6B00)'; }}
            >
              Edit Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, mono, note, children }: { label: string; value?: string; mono?: boolean; note?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
      {children ?? (
        <p className={`text-sm ${mono ? 'font-mono' : 'font-medium'} text-white`}>
          {value}
          {note && <span className="ml-1 text-xs font-normal" style={{ color: '#9CA3AF' }}>{note}</span>}
        </p>
      )}
    </div>
  );
}

function FileField({ label, filename }: { label: string; filename: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: 'rgba(11, 7, 25, 0.5)', border: '1px solid #374151' }}>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
        <p className="text-xs font-mono text-white truncate">{filename || '—'}</p>
      </div>
    </div>
  );
}

function AvailBadge({ status }: { status: Content['availability'] }) {
  const active = status === 'available';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: active ? 'rgba(124, 58, 237, 0.15)' : 'rgba(55, 65, 81, 0.4)',
        border: `1px solid ${active ? 'rgba(124, 58, 237, 0.4)' : '#374151'}`,
        color: active ? '#A78BFA' : '#9CA3AF',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: active ? '#7C3AED' : '#6B7280' }}
        aria-hidden="true"
      />
      {active ? 'Available' : 'Unavailable'}
    </span>
  );
}

// Reusable filter select
function FilterSelect({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-lg px-3 py-2 outline-none transition-colors"
      style={{ backgroundColor: '#150D2A', border: '1px solid #374151', color: '#fff', minWidth: 140 }}
    >
      {children}
    </select>
  );
}

export default function ContentTab({ content, categories, genres, onAdd, onEdit, onDelete, addToast }: ContentTabProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(ROWS_PER_PAGE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof Content | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const years = useMemo(() => {
    const ys = [...new Set(content.map((c) => c.releaseYear))].sort((a, b) => b - a);
    return ys;
  }, [content]);

  const filtered = useMemo(() => {
    let rows = content;
    if (search) rows = rows.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) rows = rows.filter((c) => c.categoryId === catFilter);
    if (genreFilter) rows = rows.filter((c) => c.genreIds.includes(genreFilter));
    if (yearFilter) rows = rows.filter((c) => c.releaseYear === parseInt(yearFilter));
    if (availFilter) rows = rows.filter((c) => c.availability === availFilter);
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [content, search, catFilter, genreFilter, yearFilter, availFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  function resetFilters() {
    setSearch(''); setCatFilter(''); setGenreFilter(''); setYearFilter(''); setAvailFilter(''); setPage(1);
  }

  function handleSort(key: keyof Content) {
    if (sortKey === key) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortIcon({ col }: { col: keyof Content }) {
    const active = sortKey === col;
    return (
      <span className="ml-1 inline-flex flex-col gap-0" aria-hidden="true">
        <svg className="w-2.5 h-2.5" style={{ color: active && sortDir === 'asc' ? '#7C3AED' : '#374151' }} fill="currentColor" viewBox="0 0 10 10"><path d="M5 0l5 5H0z" /></svg>
        <svg className="w-2.5 h-2.5" style={{ color: active && sortDir === 'desc' ? '#7C3AED' : '#374151' }} fill="currentColor" viewBox="0 0 10 10"><path d="M0 5l5 5 5-5z" /></svg>
      </span>
    );
  }

  const detailItem = detailId ? content.find((c) => c.id === detailId) : null;
  const editItem = editId ? content.find((c) => c.id === editId) : null;
  const deleteItem = deleteId ? content.find((c) => c.id === deleteId) : null;

  const thClass = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap";
  const thStyle: React.CSSProperties = { color: '#9CA3AF' };

  return (
    <div>
      {/* Filters */}
      <div className="admin-filter-row flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search content by title..."
            aria-label="Search content"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors"
            style={{ backgroundColor: '#150D2A', border: '1px solid #374151', color: '#fff' }}
          />
        </div>
        <FilterSelect id="cat-filter" value={catFilter} onChange={(v) => { setCatFilter(v); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FilterSelect>
        <FilterSelect id="genre-filter" value={genreFilter} onChange={(v) => { setGenreFilter(v); setPage(1); }}>
          <option value="">All Genres</option>
          {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </FilterSelect>
        <FilterSelect id="year-filter" value={yearFilter} onChange={(v) => { setYearFilter(v); setPage(1); }}>
          <option value="">All Release Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </FilterSelect>
        <FilterSelect id="avail-filter" value={availFilter} onChange={(v) => { setAvailFilter(v); setPage(1); }}>
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </FilterSelect>
        <button
          onClick={resetFilters}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6B7280'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          Reset Filters
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
          style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFB800, #FF8C00)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #F5A800, #FF6B00)'; }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm" style={{ backgroundColor: '#150D2A' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th className={thClass} style={thStyle}>Thumbnail</th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('id')}>Content ID <SortIcon col="id" /></th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('title')}>Title <SortIcon col="title" /></th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('categoryId')}>Category <SortIcon col="categoryId" /></th>
                <th className={thClass} style={thStyle}>Genres</th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('releaseYear')}>Year <SortIcon col="releaseYear" /></th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('runtime')}>Runtime <SortIcon col="runtime" /></th>
                <th className={thClass} style={{ ...thStyle, minWidth: '80px' }}>Rating</th>
                <th className={thClass} style={thStyle} onClick={() => handleSort('totalStreams')}>Streams <SortIcon col="totalStreams" /></th>
                <th className={thClass} style={thStyle}>Status</th>
                <th className={thClass} style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 opacity-30" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>
                        {content.length === 0 ? 'No content has been added yet.' : 'No records match your search or selected filters.'}
                      </p>
                      {content.length === 0 ? (
                        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #F5A800, #FF6B00)', color: '#1a0a00', border: 'none' }}>
                          Add Content
                        </button>
                      ) : (
                        <button onClick={resetFilters} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #374151', color: '#9CA3AF', backgroundColor: 'transparent' }}>
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {paginated.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                const itemGenres = genres.filter((g) => item.genreIds.includes(g.id));
                const isSelected = selectedId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                    className="cursor-pointer"
                    style={{
                      borderBottom: '1px solid #1F2937',
                      backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #7C3AED' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124, 58, 237, 0.06)'; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    {/* Thumbnail */}
                    <td className="px-3 py-2">
                      <div
                        className="w-16 h-10 rounded overflow-hidden flex-shrink-0 cursor-pointer"
                        style={{ border: '1px solid #374151', backgroundColor: 'var(--color-ink)' }}
                        onClick={(e) => { e.stopPropagation(); setDetailId(item.id); }}
                        role="button"
                        aria-label={`View details for ${item.title}`}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDetailId(item.id); }}}
                      >
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={`${item.title} thumbnail`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                            <svg className="w-5 h-5 opacity-40" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* ID */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs" style={{ color: '#8B5CF6' }}>{item.id}</span>
                    </td>
                    {/* Title */}
                    <td className="px-3 py-2 max-w-[180px]">
                      <span className="font-medium text-white truncate block">{item.title}</span>
                    </td>
                    {/* Category */}
                    <td className="px-3 py-2">
                      <span style={{ color: '#9CA3AF' }}>{cat?.name ?? '—'}</span>
                    </td>
                    {/* Genres */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {itemGenres.slice(0, 2).map((g) => (
                          <span key={g.id} className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#C4B5FD' }}>{g.name}</span>
                        ))}
                        {itemGenres.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ color: '#9CA3AF' }}>+{itemGenres.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    {/* Year */}
                    <td className="px-3 py-2 text-white">{item.releaseYear}</td>
                    {/* Runtime */}
                    <td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{formatRuntime(item.runtime)}</td>
                    {/* Rating */}
                    <td className="px-3 py-2">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded font-bold"
                        style={{
                          fontSize: '0.6rem',
                          letterSpacing: '0.04em',
                          border: '1.5px solid #6B7280',
                          color: '#E5E7EB',
                          backgroundColor: 'rgba(55, 65, 81, 0.35)',
                          minWidth: '3.2rem',
                          textAlign: 'center',
                        }}
                      >
                        {item.ageRating}
                      </span>
                    </td>
                    {/* Streams */}
                    <td className="px-3 py-2 font-semibold" style={{ color: '#F5A800' }}>{formatStreams(item.totalStreams)}</td>
                    {/* Status */}
                    <td className="px-3 py-2"><AvailBadge status={item.availability} /></td>
                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <ActionBtn label="View" onClick={() => setDetailId(item.id)} />
                        <ActionBtn label="Edit" onClick={() => setEditId(item.id)} />
                        <ActionBtn label="Delete" onClick={() => setDeleteId(item.id)} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
          style={{ borderTop: '1px solid #374151', backgroundColor: 'rgba(11, 7, 25, 0.3)' }}
        >
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Showing {filtered.length === 0 ? '0' : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)}`} of {filtered.length} content items
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </PageBtn>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 7) {
                if (i === 5) return <span key="ellipsis" className="px-1 text-xs" style={{ color: '#9CA3AF' }}>…</span>;
                if (i === 6) p = totalPages;
              }
              return (
                <PageBtn key={p} onClick={() => setPage(p)} active={page === p} aria-label={`Page ${p}`} aria-current={page === p ? 'page' : undefined}>
                  {p}
                </PageBtn>
              );
            })}
            <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </PageBtn>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          categories={categories}
          genres={genres}
          onClose={() => setDetailId(null)}
          onEdit={() => { setDetailId(null); setEditId(detailItem.id); }}
          onDelete={() => { setDeleteId(detailItem.id); setDetailId(null); }}
        />
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Content" onClose={() => setShowAdd(false)} wide>
          <ContentForm
            initial={emptyForm}
            categories={categories}
            genres={genres}
            submitLabel="Add Content"
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) => {
              onAdd(data);
              setShowAdd(false);
              addToast('Content added successfully.', 'success');
            }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title="Edit Content" onClose={() => setEditId(null)} wide>
          <ContentForm
            initial={{
              title: editItem.title, categoryId: editItem.categoryId, genreIds: editItem.genreIds,
              synopsis: editItem.synopsis, releaseYear: editItem.releaseYear, runtime: editItem.runtime,
              ageRating: editItem.ageRating, thumbnailUrl: editItem.thumbnailUrl, thumbnailFilename: editItem.thumbnailFilename,
              videoFilename: editItem.videoFilename, subtitleFilename: editItem.subtitleFilename,
              availability: editItem.availability,
            }}
            categories={categories}
            genres={genres}
            submitLabel="Save Changes"
            readOnlyId={editItem.id}
            readOnlyStreams={editItem.totalStreams}
            onCancel={() => setEditId(null)}
            onSubmit={(data) => {
              onEdit({ ...editItem, ...data });
              setEditId(null);
              addToast('Content updated successfully.', 'success');
            }}
            onDelete={() => { setDeleteId(editItem.id); setEditId(null); }}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <ConfirmDialog
          title="Delete Content?"
          message="Are you sure you want to delete this content? Related genre assignments, soundtracks, film refreshers, reviews, reactions, and uploaded files may also be affected."
          confirmLabel="Delete Content"
          onConfirm={() => {
            onDelete(deleteItem.id);
            setDeleteId(null);
            addToast(`"${deleteItem.title}" deleted.`, 'success');
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function ActionBtn({
  label, onClick, danger, children, 'aria-label': ariaLabel
}: {
  label?: string; onClick: () => void; danger?: boolean; children?: React.ReactNode;
  'aria-label'?: string; disabled?: boolean; active?: boolean; 'aria-current'?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="px-2 py-1 rounded text-xs font-medium transition-colors duration-150"
      style={{
        border: `1px solid ${danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(124, 58, 237, 0.4)'}`,
        color: danger ? '#EF4444' : '#A78BFA',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.15)';
      }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children ?? label}
    </button>
  );
}

function PageBtn({
  children, onClick, disabled, active, 'aria-label': ariaLabel, 'aria-current': ariaCurrent,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
  'aria-label'?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className="w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors disabled:opacity-40"
      style={{
        backgroundColor: active ? '#7C3AED' : 'transparent',
        color: active ? '#fff' : '#9CA3AF',
        border: `1px solid ${active ? '#7C3AED' : '#374151'}`,
      }}
      onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}
    >
      {children}
    </button>
  );
}
