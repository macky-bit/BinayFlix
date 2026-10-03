import { useState, useMemo } from 'react'
import type { ContentItem, Category, Genre, Soundtrack, ContentAvailability } from '../types'
import { useAdminCollection, useAdminRepository } from '../../data'
import { formatNumber, generateId } from '../utils'
import { GenericBadge } from '../components/Badge'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

type ContentTab = 'content' | 'categories' | 'genres' | 'soundtracks'

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">{children}</div>
    </div>
  )
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-16 text-center text-sm" style={{ color: 'var(--taupe)' }}>
        {message}
      </td>
    </tr>
  )
}

function ThumbnailPlaceholder({ title }: { title: string }) {
  const colors = ['#7C3AED', '#0891B2', '#059669', '#B45309', '#DB2777', '#2563EB', '#DC2626']
  const color = colors[title.charCodeAt(0) % colors.length]
  return (
    <div className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color, fontSize: 8 }}>
      {title.slice(0, 3).toUpperCase()}
    </div>
  )
}

// Content View Modal
function ContentViewModal({ item, onClose, onEdit }: { item: ContentItem; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Content Details</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          {[
            ['Content ID', item.id],
            ['Title', item.title],
            ['Category', item.category],
            ['Genres', item.genres.join(', ')],
            ['Release Year', item.releaseYear],
            ['Runtime', item.runtime],
            ['Age Rating', item.ageRating],
            ['Total Streams', formatNumber(item.totalStreams)],
            ['Availability', item.availability],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between gap-4">
              <span style={{ color: 'var(--taupe)' }}>{label}</span>
              <span className="text-white font-medium text-right">{String(val)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium">Close</button>
          <button onClick={onEdit} className="btn-gold px-4 py-2 rounded-lg text-sm">Edit Content</button>
        </div>
      </div>
    </div>
  )
}

// Content Edit Modal
function ContentEditModal({ item, items, onSave, onClose }: {
  item: ContentItem | null; items: ContentItem[]
  onSave: (updated: ContentItem) => void; onClose: () => void
}) {
  const blank: ContentItem = { id: '', title: '', category: 'Movie', genres: [], releaseYear: 2024, runtime: '', ageRating: 'PG-13', totalStreams: 0, availability: 'Available', thumbnail: '' }
  const [form, setForm] = useState<ContentItem>(item ?? blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const isNew = !item

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required.'
    if (!form.runtime.trim()) e.runtime = 'Runtime is required.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => {
      const id = isNew ? generateId('CNT', items) : form.id
      onSave({ ...form, id })
      setLoading(false)
    }, 700)
  }

  const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA']
  const ALL_GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Crime', 'History', 'Adventure', 'Romance', 'Horror']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{isNew ? 'Add Content' : 'Edit Content'}</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {!isNew && <div><label className="block text-sm font-medium mb-1.5 text-white">Content ID</label><div className="input-field opacity-50">{form.id}</div></div>}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">Title <span className="text-red-400">*</span></label>
            <input className="input-field" value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })) }} placeholder="Enter title" />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">Category</label>
              <select className="select-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['Movie', 'TV Series', 'Documentary', 'Mini-Series'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">Release Year</label>
              <input type="number" className="input-field" value={form.releaseYear} onChange={e => setForm(f => ({ ...f, releaseYear: Number(e.target.value) }))} min={1900} max={2030} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">Genres</label>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map(g => (
                <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="accent-purple-500" checked={form.genres.includes(g)}
                    onChange={e => setForm(f => ({ ...f, genres: e.target.checked ? [...f.genres, g] : f.genres.filter(x => x !== g) }))} />
                  <span className="text-sm text-white">{g}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">Runtime <span className="text-red-400">*</span></label>
              <input className="input-field" value={form.runtime} onChange={e => { setForm(f => ({ ...f, runtime: e.target.value })); setErrors(er => ({ ...er, runtime: '' })) }} placeholder="e.g. 148 min" />
              {errors.runtime && <p className="mt-1 text-xs text-red-400">{errors.runtime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">Age Rating</label>
              <select className="select-field" value={form.ageRating} onChange={e => setForm(f => ({ ...f, ageRating: e.target.value }))}>
                {AGE_RATINGS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">Availability</label>
            <select className="select-field" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value as ContentAvailability }))}>
              <option>Available</option><option>Unavailable</option>
            </select>
          </div>
          {!isNew && (
            <div><label className="block text-sm font-medium mb-1.5 text-white">Total Streams</label><div className="input-field opacity-50">{formatNumber(form.totalStreams)}</div></div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>{loading ? 'Saving…' : isNew ? 'Add Content' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('content')
  const contentState = useAdminCollection(useAdminRepository<ContentItem>('content'))
  const categories = useAdminCollection(useAdminRepository<Category>('categories')).items
  const genres = useAdminCollection(useAdminRepository<Genre>('genres')).items
  const soundtrackState = useAdminCollection(useAdminRepository<Soundtrack>('soundtracks'))
  const contentItems = contentState.items.map(item => ({
    ...item,
    availability: (item.availability === 'Available' || String(item.availability) === 'available' ? 'Available' : 'Unavailable') as ContentItem['availability'],
  }))
  const soundtracks = soundtrackState.items
  const [search, setSearch] = useState('')
  const [availFilter, setAvailFilter] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [viewItem, setViewItem] = useState<ContentItem | null>(null)
  const [editItem, setEditItem] = useState<ContentItem | null | undefined>(undefined) // undefined = closed, null = new
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function showToast(message: string, type: 'success' | 'error' = 'success') { setToast({ message, type }) }

  const filteredContent = useMemo(() => {
    let list = [...contentItems]
    const q = search.toLowerCase()
    if (q) list = list.filter(c => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    if (availFilter) list = list.filter(c => c.availability === availFilter)
    return list
  }, [contentItems, search, availFilter])

  function handleSaveContent(updated: ContentItem) {
    const exists = contentItems.some(c => c.id === updated.id)
    const databaseItem = {
      ...updated,
      categoryId: categories.find(category => category.name === updated.category)?.id,
      genreIds: genres.filter(genre => updated.genres.includes(genre.name)).map(genre => genre.id),
      availability: updated.availability,
    }
    if (exists) void contentState.update(updated.id, databaseItem)
    else void contentState.create(databaseItem)
    setEditItem(undefined)
    showToast(exists ? 'Content updated successfully.' : 'Content added successfully.')
  }

  function handleDeleteContent() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    void contentState.remove(deleteTarget).then(() => {
      setDeleteTarget(null)
      setDeleteLoading(false)
      showToast('Content deleted successfully.')
    }).catch((error: Error) => { setDeleteLoading(false); showToast(error.message, 'error') })
  }

  const TABS: { id: ContentTab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'categories', label: 'Categories' },
    { id: 'genres', label: 'Genres' },
    { id: 'soundtracks', label: 'Soundtracks' },
  ]

  return (
    <div className="px-4 md:px-6 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {viewItem && <ContentViewModal item={viewItem} onClose={() => setViewItem(null)} onEdit={() => { setEditItem(viewItem); setViewItem(null) }} />}
      {editItem !== undefined && (
        <ContentEditModal item={editItem} items={contentItems} onSave={handleSaveContent} onClose={() => setEditItem(undefined)} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          heading="Delete content?"
          message="This content will be permanently removed from STREAMFLIX."
          confirmLabel="Delete Content"
          onConfirm={handleDeleteContent}
          onCancel={() => setDeleteTarget(null)}
          danger loading={deleteLoading}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--taupe)' }}>Manage STREAMFLIX content, categories, genres, and soundtracks.</p>
        </div>
        {activeTab === 'content' && (
          <button onClick={() => setEditItem(null)} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Content
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--stone)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-40">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--taupe)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder="Search content…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="select-field" style={{ width: 'auto', minWidth: 160 }} value={availFilter} onChange={e => setAvailFilter(e.target.value)}>
              <option value="">All Availability</option>
              <option>Available</option><option>Unavailable</option>
            </select>
            <button onClick={() => { setSearch(''); setAvailFilter('') }} className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium">Reset Filters</button>
          </div>
          <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                  {['Thumbnail', 'Content ID', 'Title', 'Category', 'Genres', 'Year', 'Runtime', 'Rating', 'Streams', 'Availability', 'Actions'].map(col => (
                    <th key={col} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContent.length === 0
                  ? <EmptyRow cols={11} message="No content matches your search or filters." />
                  : filteredContent.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-3 py-3"><ThumbnailPlaceholder title={c.title} /></td>
                      <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{c.id}</span></td>
                      <td className="px-3 py-3 font-medium text-white whitespace-nowrap">{c.title}</td>
                      <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{c.category}</td>
                      <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{c.genres.map(g => <span key={g} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>{g}</span>)}</div></td>
                      <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{c.releaseYear}</td>
                      <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{c.runtime}</td>
                      <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{c.ageRating}</td>
                      <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--gold)' }}>{formatNumber(c.totalStreams)}</td>
                      <td className="px-3 py-3"><GenericBadge label={c.availability} /></td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setViewItem(c)} className="btn-wine px-2 py-1 rounded text-xs">View</button>
                          <button onClick={() => setEditItem(c)} className="btn-wine px-2 py-1 rounded text-xs">Edit</button>
                          <button onClick={() => setDeleteTarget(c.id)} className="btn-danger px-2 py-1 rounded text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </TableWrapper>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                {['Category ID', 'Name', 'Description', 'Content Count', 'Actions'].map(col => (
                  <th key={col} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--taupe)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{cat.id}</span></td>
                  <td className="px-3 py-3 font-medium text-white">{cat.name}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{cat.description}</td>
                  <td className="px-3 py-3 text-center" style={{ color: 'var(--gold)' }}>{cat.contentCount}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="btn-wine px-2 py-1 rounded text-xs" onClick={() => showToast('Category updated successfully.')}>Edit</button>
                      <button className="btn-danger px-2 py-1 rounded text-xs" onClick={() => showToast('Category deleted.', 'success')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                {['Genre ID', 'Name', 'Content Count', 'Actions'].map(col => (
                  <th key={col} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--taupe)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {genres.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{g.id}</span></td>
                  <td className="px-3 py-3 font-medium text-white">{g.name}</td>
                  <td className="px-3 py-3 text-center" style={{ color: 'var(--gold)' }}>{g.contentCount}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="btn-wine px-2 py-1 rounded text-xs" onClick={() => showToast('Genre updated successfully.')}>Edit</button>
                      <button className="btn-danger px-2 py-1 rounded text-xs" onClick={() => showToast('Genre deleted.')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* Soundtracks Tab */}
      {activeTab === 'soundtracks' && (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                {['Soundtrack ID', 'Content', 'Title', 'Artist', 'Duration', 'Actions'].map(col => (
                  <th key={col} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--taupe)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {soundtracks.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{s.id}</span></td>
                  <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{s.contentTitle}</td>
                  <td className="px-3 py-3 font-medium text-white">{s.title}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{s.artist}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--taupe)' }}>{s.duration}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="btn-wine px-2 py-1 rounded text-xs" onClick={() => showToast('Soundtrack details.')}>View</button>
                      <button className="btn-danger px-2 py-1 rounded text-xs" onClick={() => void soundtrackState.remove(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  )
}
