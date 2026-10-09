import { useCallback, useState, type ReactNode } from "react"
import type { Tab, Toast } from "./types"

import ContentTab from "./components/tabs/ContentTab"

import CategoriesTab from "./components/tabs/CategoriesTab"

import GenresTab from "./components/tabs/GenresTab"

import SoundtracksTab from "./components/tabs/SoundtracksTab"

import FilmRefreshersTab from "./components/tabs/FilmRefreshersTab"

import ToastContainer from "./components/shared/Toast"

import { useContentManagerData } from "./useContentManagerData"

import { AdminPageHeader } from "../components/AdminUI"

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

function ContentSectionIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, ReactNode> = {
    content: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m9 8 6 4-6 4Z" />
      </>
    ),
    categories: (
      <>
        <path d="M3 7h7l2 2h9v10H3Z" />
        <path d="M3 7V5h7l2 2" />
      </>
    ),
    genres: (
      <>
        <path d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    soundtracks: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    "film-refreshers": (
      <>
        <path d="M4 7h11a5 5 0 1 1-4.6 7" />
        <path d="m4 7 3-3M4 7l3 3" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[tab]}
    </svg>
  )
}

export default function ContentManagerView() {
  const [activeTab, setActiveTab] = useState<Tab>("content")
  const [addRequest, setAddRequest] = useState(0)
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

  const availableTitles = content.filter(
    (item) => item.availability === "available",
  ).length
  const availabilityPercent = content.length
    ? Math.round((availableTitles / content.length) * 100)
    : 0

  const openAddTitle = () => {
    setActiveTab("content")
    setAddRequest((request) => request + 1)
  }

  return (
    <div className="admin-page-shell content-library-workspace">
      <AdminPageHeader
        eyebrow="Library operations"
        title="Content Library"
        description="Manage titles, metadata, availability, and media assets."
        actions={
          <button
            type="button"
            className="content-library__add-button"
            onClick={openAddTitle}
          >
            <span aria-hidden="true">+</span>
            Add title
          </button>
        }
      />

      <div className="content-overview" aria-label="Catalog overview">
        <button
          type="button"
          className="content-overview__catalog"
          onClick={() => setActiveTab("content")}
          aria-pressed={activeTab === "content"}
        >
          <span className="content-overview__eyebrow">Catalog overview</span>
          <strong>{content.length} titles</strong>
          <span>Loaded content records</span>
          <span className="content-overview__coverage-label">
            <span>Available titles</span>
            <span>
              {availableTitles} of {content.length}
            </span>
          </span>
          <span
            className="content-overview__progress"
            role="progressbar"
            aria-label="Available catalog coverage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={availabilityPercent}
          >
            <span style={{ width: `${availabilityPercent}%` }} />
          </span>
        </button>
        <div className="content-overview__metadata">
          <button
            type="button"
            className="content-overview__metric is-gold"
            onClick={() => setActiveTab("categories")}
          >
            <span>Categories</span>
            <strong>{categories.length}</strong>
            <small>Catalog groupings</small>
          </button>
          <button
            type="button"
            className="content-overview__metric is-blue"
            onClick={() => setActiveTab("genres")}
          >
            <span>Genres</span>
            <strong>{genres.length}</strong>
            <small>Discovery classifications</small>
          </button>
          <section className="content-overview__metric is-green">
            <span>Media extras</span>
            <strong>{soundtracks.length + refreshers.length}</strong>
            <small>Soundtracks and refreshers</small>
          </section>
        </div>
      </div>

      <div className="admin-content-layout">
        <nav
          className="content-section-rail"
          aria-label="Content management sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-label={tab.label}
              title={tab.label}
            >
              <ContentSectionIcon tab={tab.id} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

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
                addRequest={addRequest}
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
                <h2 className="text-xl font-semibold text-white mb-1">
                  Genres
                </h2>
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
