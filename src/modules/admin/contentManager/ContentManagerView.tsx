import { useCallback, useState } from "react"
import type { Tab, Toast } from "./types"
import ContentTab from "./components/tabs/ContentTab"
import CategoriesTab from "./components/tabs/CategoriesTab"
import GenresTab from "./components/tabs/GenresTab"
import SoundtracksTab from "./components/tabs/SoundtracksTab"
import FilmRefreshersTab from "./components/tabs/FilmRefreshersTab"
import ToastContainer from "./components/shared/Toast"
import { useContentManagerData } from "./useContentManagerData"
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStats,
  AdminWorkspaceTabs,
} from "../components/AdminUI"

const TABS: {
  id: Tab
  label: string
}[] = [
  { id: "content", label: "Content" },
  { id: "categories", label: "Categories" },
  { id: "genres", label: "Genres" },
  { id: "soundtracks", label: "Soundtracks" },
  { id: "film-refreshers", label: "Film Refreshers" },
]

export default function ContentManagerView() {
  const [activeTab, setActiveTab] = useState<Tab>("content")
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = String(Date.now())
    setToasts((t) => [...t, { id, message, type }])
  }, [])
  const dismissToast = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  )
  const {
    content,
    categories,
    genres,
    soundtracks,
    refreshers,
    addContent,
    editContent,
    deleteContent,
    addCategory,
    editCategory,
    deleteCategory,
    addGenre,
    editGenre,
    deleteGenre,
    addSoundtrack,
    editSoundtrack,
    deleteSoundtrack,
    addRefresher,
    editRefresher,
    deleteRefresher,
  } = useContentManagerData((message) => addToast(message, "error"))

  return (
    <div className="admin-page-shell">
      <AdminPageHeader
        eyebrow="Library operations"
        title="Content Management"
        description="Curate StreamFlix titles and the metadata that powers the member catalog."
      />

      <AdminStats>
        <AdminStatCard label="Catalog titles" value={content.length} hint="Loaded content records" tone="purple" active={activeTab === "content"} onClick={() => setActiveTab("content")} />
        <AdminStatCard label="Categories" value={categories.length} hint="Catalog groupings" tone="gold" active={activeTab === "categories"} onClick={() => setActiveTab("categories")} />
        <AdminStatCard label="Genres" value={genres.length} hint="Discovery classifications" tone="blue" active={activeTab === "genres"} onClick={() => setActiveTab("genres")} />
        <AdminStatCard label="Media extras" value={soundtracks.length + refreshers.length} hint="Soundtracks and refreshers" tone="green" />
      </AdminStats>

      <div className="admin-content-layout">
      <AdminWorkspaceTabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        label="Content management sections"
      />

      {/* Tab content */}
      <div className="admin-tab-panel">
        {activeTab === "content" && (
          <div
            role="tabpanel"
            id="tabpanel-content"
            aria-labelledby="tab-content"
          >
            <ContentTab
              content={content}
              categories={categories}
              genres={genres}
              onAdd={addContent}
              onEdit={editContent}
              onDelete={deleteContent}
              addToast={addToast}
            />
          </div>
        )}
        {activeTab === "categories" && (
          <div
            role="tabpanel"
            id="tabpanel-categories"
            aria-labelledby="tab-categories"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white mb-1">
                Categories
              </h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Manage the categories used to organize STREAMFLIX content.
              </p>
            </div>
            <CategoriesTab
              categories={categories}
              onAdd={addCategory}
              onEdit={editCategory}
              onDelete={deleteCategory}
              addToast={addToast}
            />
          </div>
        )}
        {activeTab === "genres" && (
          <div
            role="tabpanel"
            id="tabpanel-genres"
            aria-labelledby="tab-genres"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white mb-1">Genres</h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Manage the genres used to classify STREAMFLIX content.
              </p>
            </div>
            <GenresTab
              genres={genres}
              onAdd={addGenre}
              onEdit={editGenre}
              onDelete={deleteGenre}
              addToast={addToast}
            />
          </div>
        )}
        {activeTab === "soundtracks" && (
          <div
            role="tabpanel"
            id="tabpanel-soundtracks"
            aria-labelledby="tab-soundtracks"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white mb-1">
                Soundtracks
              </h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Manage soundtrack information connected to STREAMFLIX content.
              </p>
            </div>
            <SoundtracksTab
              soundtracks={soundtracks}
              content={content}
              onAdd={addSoundtrack}
              onEdit={editSoundtrack}
              onDelete={deleteSoundtrack}
              addToast={addToast}
            />
          </div>
        )}
        {activeTab === "film-refreshers" && (
          <div
            role="tabpanel"
            id="tabpanel-film-refreshers"
            aria-labelledby="tab-film-refreshers"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white mb-1">
                Film Refreshers
              </h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Manage summaries that help viewers remember previous films
                before watching a sequel.
              </p>
            </div>
            <FilmRefreshersTab
              refreshers={refreshers}
              content={content}
              onAdd={addRefresher}
              onEdit={editRefresher}
              onDelete={deleteRefresher}
              addToast={addToast}
            />
          </div>
        )}
      </div>

      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Inject animation keyframe */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
