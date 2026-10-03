import { useCallback, useState } from "react"
import type { Tab, Toast } from "./types"
import Navbar from "./components/Navbar"
import ContentTab from "./components/tabs/ContentTab"
import CategoriesTab from "./components/tabs/CategoriesTab"
import GenresTab from "./components/tabs/GenresTab"
import SoundtracksTab from "./components/tabs/SoundtracksTab"
import FilmRefreshersTab from "./components/tabs/FilmRefreshersTab"
import ToastContainer from "./components/shared/Toast"
import { useContentManagerData } from "./useContentManagerData"

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      <Navbar />

      {/* Page header */}
      <div
        className="px-6 pt-8 pb-6"
        style={{ borderBottom: "1px solid rgba(55, 65, 81, 0.5)" }}
      >
        <h1 className="text-3xl font-bold text-white mb-1">
          Content Management
        </h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Manage STREAMFLIX content, categories, genres, soundtracks, and film
          refreshers.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6" style={{ borderBottom: "1px solid #374151" }}>
        <div
          className="flex gap-0 overflow-x-auto"
          role="tablist"
          aria-label="Content management sections"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0 outline-none"
                style={{
                  color: active ? "#fff" : "#9CA3AF",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: active
                    ? "2px solid #7C3AED"
                    : "2px solid transparent",
                  textShadow: active
                    ? "0 0 12px rgba(124, 58, 237, 0.4)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#8B5CF6"
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#9CA3AF"
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
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
