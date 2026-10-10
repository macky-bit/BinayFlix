import { useEffect, useRef, useState, useMemo } from "react"
import type { Content, Category, Genre, Toast } from "../../types"

import AdminDetailsPanel, {
  AdminDetailsSection,
} from "../../../components/AdminDetailsPanel"
import {
  AdminRowAction,
  AdminTablePagination,
} from "../../../components/AdminUI"

import ConfirmDialog from "../shared/ConfirmDialog"

import Modal from "../shared/Modal"

interface ContentTabProps {
  content: Content[]

  categories: Category[]

  genres: Genre[]

  onAdd: (item: Omit<Content, "id" | "totalStreams" | "syncedAt">) => void
  onEdit: (item: Content) => Promise<void>

  onDelete: (id: string) => void
  addToast: (msg: string, type: Toast["type"]) => void
  addRequest?: number
}

const ROWS_PER_PAGE = 10

const AGE_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
  "NR",
]

function formatStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`

  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`

  return n.toString()
}

function formatRuntime(mins: number) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)

    const m = mins % 60

    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return `${mins} min`
}

function ratingClass(rating: string) {
  return `content-table__rating-badge--${rating.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}

const inputClass = `w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#9CA3AF] outline-none transition-colors duration-150 focus:ring-1`

const inputStyle = {
  backgroundColor: "var(--color-ink)",

  border: "1px solid #374151",

  "--focus-ring-color": "#7C3AED",
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p className="mt-1 text-xs" style={{ color: "#EF4444" }}>
      {msg}
    </p>
  ) : null
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1"
      style={{ color: "#9CA3AF" }}
    >
      {children}
      {required && (
        <span className="ml-0.5" style={{ color: "#EF4444" }}>
          *
        </span>
      )}
    </label>
  )
}

function ContentFilePicker({
  id,
  accept,
  filename,
  hint,
  onSelect,
}: {
  id: string
  accept: string
  filename: string
  hint: string
  onSelect: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="admin-content-file-picker__input sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onSelect(file)
          event.currentTarget.value = ""
        }}
      />
      <div className="admin-content-file-picker">
        <button
          type="button"
          className="admin-content-file-picker__button"
          onClick={() => inputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
          Choose file
        </button>
        <span className="admin-content-file-picker__copy">
          <strong>{filename || "No file selected"}</strong>
          <small>{hint}</small>
        </span>
      </div>
    </>
  )
}

type FormData = Omit<Content, "id" | "totalStreams" | "syncedAt">
const emptyForm: FormData = {
  title: "",
  categoryId: "",
  genreIds: [],
  synopsis: "",

  releaseYear: new Date().getFullYear(),
  runtime: 90,

  ageRating: "PG-13",
  thumbnailUrl: "",
  thumbnailFilename: "",

  videoFilename: "",
  subtitleFilename: "",
  availability: "available",
}

type Errors = Partial<Record<keyof FormData, string>>

function validate(data: FormData): Errors {
  const errors: Errors = {}

  if (!data.title.trim()) errors.title = "Title is required."

  if (!data.categoryId) errors.categoryId = "Category is required."

  if (data.genreIds.length === 0)
    errors.genreIds = "At least one genre is required."

  if (!data.synopsis.trim()) errors.synopsis = "Synopsis is required."

  if (!data.releaseYear || data.releaseYear < 1888 || data.releaseYear > 2099)
    errors.releaseYear = "Enter a valid year (1888–2099)."

  if (!data.runtime || data.runtime < 1)
    errors.runtime = "Runtime must be at least 1 minute."

  if (!data.ageRating) errors.ageRating = "Age rating is required."

  return errors
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
  initial: FormData

  categories: Category[]

  genres: Genre[]

  onSubmit: (data: FormData) => void | Promise<void>

  onCancel: () => void

  submitLabel: string

  readOnlyId?: string

  readOnlyStreams?: number

  onDelete?: () => void
}) {
  const [form, setForm] = useState<FormData>(initial)

  const [errors, setErrors] = useState<Errors>({})

  const [synopsisLen, setSynopsisLen] = useState(initial.synopsis.length)

  const [thumbPreview, setThumbPreview] = useState(initial.thumbnailUrl)

  const [saving, setSaving] = useState(false)

  const [fileErrors, setFileErrors] = useState<Partial<Record<"thumbnail" | "video" | "subtitle", string>>>({})

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }))

    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate(form)

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  function toggleGenre(gid: string) {
    const ids = form.genreIds.includes(gid)
      ? form.genreIds.filter((id) => id !== gid)
      : [...form.genreIds, gid]

    set("genreIds", ids)
  }

  function handleThumbnailFile(file?: File) {
    if (!file) return

    if (!/\.(?:jpe?g|png|webp|avif|gif)$/i.test(file.name)) {
      setFileErrors((current) => ({ ...current, thumbnail: "Choose a JPG, PNG, WebP, AVIF, or GIF image." }))
      return
    }

    setFileErrors((current) => ({ ...current, thumbnail: undefined }))

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return
      set("thumbnailUrl", reader.result)
      set("thumbnailFilename", file.name)
      setThumbPreview(reader.result)
    })
    reader.readAsDataURL(file)
  }

  function handleNamedFile(
    key: "videoFilename" | "subtitleFilename",
    file?: File,
  ) {
    if (!file) return

    const isVideo = key === "videoFilename"
    const valid = isVideo
      ? /\.(?:mp4|webm|og[gv]|mkv|mov|m4v)$/i.test(file.name)
      : /\.(?:srt|vtt|ass|ssa)$/i.test(file.name)
    const errorKey = isVideo ? "video" : "subtitle"

    if (!valid) {
      setFileErrors((current) => ({
        ...current,
        [errorKey]: isVideo
          ? "Choose an MP4, WebM, OGV, MKV, MOV, or M4V video."
          : "Choose an SRT, VTT, ASS, or SSA subtitle file.",
      }))
      return
    }

    setFileErrors((current) => ({ ...current, [errorKey]: undefined }))
    set(key, file.name)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="admin-content-form w-full min-w-0">
      {readOnlyId && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-lg p-3"
          style={{
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
          }}
        >
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            Content ID
          </span>
          <span
            className="text-sm font-mono font-semibold"
            style={{ color: "#8B5CF6" }}
          >
            {readOnlyId}
          </span>
          {readOnlyStreams !== undefined && (
            <>
              <span
                className="w-px h-4 mx-1"
                style={{ backgroundColor: "#374151" }}
              />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                Total Streams
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: "#F5A800" }}
              >
                {readOnlyStreams.toLocaleString()}
              </span>
              <span className="text-xs ml-1" style={{ color: "#9CA3AF" }}>
                (read-only)
              </span>
            </>
          )}
        </div>
      )}

      <div className="admin-content-form__layout">
        <section className="admin-content-form__section" aria-labelledby="content-details-heading">
          <div className="admin-content-form__section-heading">
            <div>
              <h3 id="content-details-heading">Content details</h3>
              <p>Core information viewers use to identify and discover this title.</p>
            </div>
          </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Title */}
        <div className="sm:col-span-2">
          <Label htmlFor="cnt-title" required>
            Title
          </Label>
          <input
            id="cnt-title"
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Enter content title"
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: errors.title ? "#EF4444" : "#374151",
            }}
          />
          <FieldError msg={errors.title} />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="cnt-category" required>
            Category
          </Label>
          <select
            id="cnt-category"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: errors.categoryId ? "#EF4444" : "#374151",
            }}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError msg={errors.categoryId} />
        </div>

        {/* Age Rating */}
        <div>
          <Label htmlFor="cnt-age" required>
            Age Rating
          </Label>
          <select
            id="cnt-age"
            value={form.ageRating}
            onChange={(e) => set("ageRating", e.target.value)}
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: errors.ageRating ? "#EF4444" : "#374151",
            }}
          >
            {AGE_RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <FieldError msg={errors.ageRating} />
        </div>

        {/* Release Year */}
        <div>
          <Label htmlFor="cnt-year" required>
            Release Year
          </Label>
          <input
            id="cnt-year"
            type="number"
            min={1888}
            max={2099}
            value={form.releaseYear}
            onChange={(e) => set("releaseYear", parseInt(e.target.value) || 0)}
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: errors.releaseYear ? "#EF4444" : "#374151",
            }}
          />
          <FieldError msg={errors.releaseYear} />
        </div>

        {/* Runtime */}
        <div>
          <Label htmlFor="cnt-runtime" required>
            Runtime (minutes)
          </Label>
          <input
            id="cnt-runtime"
            type="number"
            min={1}
            value={form.runtime}
            onChange={(e) => set("runtime", parseInt(e.target.value) || 0)}
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: errors.runtime ? "#EF4444" : "#374151",
            }}
          />
          <FieldError msg={errors.runtime} />
        </div>
      </div>

      {/* Genres */}
      <div className="mb-4">
        <Label htmlFor="cnt-genres" required>
          Genres
        </Label>
        <div
          className="flex flex-wrap gap-2 p-3 rounded-lg"
          style={{
            backgroundColor: "var(--color-ink)",
            border: `1px solid ${errors.genreIds ? "#EF4444" : "#374151"}`,
          }}
          id="cnt-genres"
          role="group"
          aria-label="Genre selection"
        >
          {genres.map((g) => {
            const active = form.genreIds.includes(g.id)

            return (
              <button
                type="button"
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                aria-pressed={active}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: active
                    ? "rgba(124, 58, 237, 0.3)"
                    : "rgba(55, 65, 81, 0.4)",

                  border: `1px solid ${active ? "#7C3AED" : "#374151"}`,

                  color: active ? "#C4B5FD" : "#9CA3AF",
                }}
              >
                {g.name}
              </button>
            )
          })}
        </div>
        <FieldError msg={errors.genreIds} />
      </div>

      {/* Synopsis */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="cnt-synopsis" required>
            Synopsis
          </Label>
          <span
            className="text-xs"
            style={{ color: synopsisLen > 1000 ? "#EF4444" : "#9CA3AF" }}
          >
            {synopsisLen}/1000
          </span>
        </div>
        <textarea
          id="cnt-synopsis"
          rows={4}
          value={form.synopsis}
          maxLength={1000}
          onChange={(e) => {
            set("synopsis", e.target.value)
            setSynopsisLen(e.target.value.length)
          }}
          placeholder="Enter synopsis..."
          className={`${inputClass} resize-none`}
          style={{
            ...inputStyle,
            borderColor: errors.synopsis ? "#EF4444" : "#374151",
          }}
        />
        <FieldError msg={errors.synopsis} />
      </div>

        </section>

        <div className="admin-content-form__secondary">

      <section className="admin-content-media-fields" aria-labelledby="content-media-heading">
        <div className="admin-content-media-fields__heading">
          <div>
            <h3 id="content-media-heading">Media files</h3>
            <p>Choose the artwork, video, and optional subtitle file for this title.</p>
          </div>
        </div>

        <div className="admin-content-media-fields__grid">
          <div className="admin-content-media-fields__thumbnail">
            <Label htmlFor="cnt-thumb">Thumbnail File</Label>
            <ContentFilePicker
              id="cnt-thumb"
              accept=".jpg,.jpeg,.png,.webp,.avif,.gif"
              filename={form.thumbnailFilename}
              hint="JPG, PNG, WebP, AVIF, or GIF"
              onSelect={handleThumbnailFile}
            />
            <FieldError msg={fileErrors.thumbnail} />
            {thumbPreview && (
              <div className="admin-content-thumbnail-preview">
                <img
                  src={thumbPreview}
                  alt="Thumbnail preview"
                  onError={() => setThumbPreview("")}
                />
                <span>Thumbnail preview</span>
              </div>
            )}
          </div>

          <div className="admin-content-media-fields__secondary">
            <div className="admin-content-media-fields__upload">
              <Label htmlFor="cnt-video">Video File</Label>
              <ContentFilePicker
                id="cnt-video"
                accept=".mp4,.webm,.ogv,.mkv,.mov,.m4v"
                filename={form.videoFilename}
                hint="MP4, WebM, OGV, MKV, MOV, or M4V"
                onSelect={(file) => handleNamedFile("videoFilename", file)}
              />
              <FieldError msg={fileErrors.video} />
            </div>
            <div className="admin-content-media-fields__upload">
              <Label htmlFor="cnt-sub">Subtitle File</Label>
              <ContentFilePicker
                id="cnt-sub"
                accept=".srt,.vtt,.ass,.ssa"
                filename={form.subtitleFilename}
                hint="SRT, VTT, ASS, or SSA"
                onSelect={(file) => handleNamedFile("subtitleFilename", file)}
              />
              <FieldError msg={fileErrors.subtitle} />
            </div>
          </div>
        </div>
      </section>

      {/* Availability */}
      <section className="admin-content-availability" aria-labelledby="content-availability-heading">
        <div className="admin-content-form__section-heading admin-content-form__section-heading--compact">
          <div>
            <h3 id="content-availability-heading">Availability</h3>
            <p>Control whether viewers can find and play this title.</p>
          </div>
        </div>
        <div className="admin-content-availability__options" role="radiogroup" aria-labelledby="content-availability-heading">
          {(["available", "unavailable"] as const).map((v) => (
            <label key={v} className="admin-content-availability__option">
              <input
                type="radio"
                name="availability"
                value={v}
                checked={form.availability === v}
                onChange={() => set("availability", v)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: form.availability === v ? "#7C3AED" : "#374151",
                }}
              >
                {form.availability === v && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#7C3AED" }}
                  />
                )}
              </div>
              <span
                className="text-sm font-medium capitalize"
                style={{ color: form.availability === v ? "#fff" : "#9CA3AF" }}
              >
                {v}
              </span>
            </label>
          ))}
        </div>
      </section>
        </div>
      </div>

      {/* Actions */}
      <div
        className="admin-content-form__actions flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="w-full sm:w-auto">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#EF4444",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
              }}
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
            style={{
              backgroundColor: "transparent",
              border: "1px solid #374151",
              color: "#9CA3AF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6B7280"
              e.currentTarget.style.color = "#fff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#374151"
              e.currentTarget.style.color = "#9CA3AF"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-details-button admin-details-button--primary flex w-full items-center justify-center gap-2 sm:w-auto"
            disabled={saving}
            aria-busy={saving || undefined}
            style={{ flex: "0 0 auto" }}
          >
            {submitLabel.startsWith("Add ") && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function DetailDrawer({
  item,

  categories,

  genres,

  onClose,

  onEdit,

  onDelete,
}: {
  item: Content

  categories: Category[]

  genres: Genre[]

  onClose: () => void

  onEdit: () => void

  onDelete: () => void
}) {
  const cat = categories.find((c) => c.id === item.categoryId)

  const itemGenres = genres.filter((g) => item.genreIds.includes(g.id))

  return (
    <AdminDetailsPanel
      title="Content Details"
      onClose={onClose}
      footer={
        <div className="admin-details-actions">
          <button
            onClick={onDelete}
            className="admin-details-button admin-details-button--danger"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="admin-details-button admin-details-button--secondary"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="admin-details-button admin-details-button--primary"
          >
            Edit Content
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Thumbnail */}
        {item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            alt={`${item.title} thumbnail`}
            className="w-full rounded-xl object-cover"
            style={{ maxHeight: 200, border: "1px solid #374151" }}
          />
        )}

        <AdminDetailsSection title="Content Information">
          {/* IDs */}
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Content ID" value={item.id} mono />
            <DetailField
              label="Total Streams"
              value={item.totalStreams.toLocaleString()}
              note="(read-only)"
            />
          </div>

          <DetailField label="Title" value={item.title} />
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Category" value={cat?.name ?? "—"} />
            <DetailField label="Availability">
              <AvailBadge status={item.availability} />
            </DetailField>
          </div>

          {/* Genres */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#9CA3AF" }}>
              Genres
            </p>
            <div className="flex flex-wrap gap-1.5">
              {itemGenres.map((g) => (
                <span
                  key={g.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(124, 58, 237, 0.2)",
                    border: "1px solid rgba(124, 58, 237, 0.4)",
                    color: "#C4B5FD",
                  }}
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#9CA3AF" }}>
              Synopsis
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#E5E7EB" }}>
              {item.synopsis}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DetailField
              label="Release Year"
              value={item.releaseYear.toString()}
            />
            <DetailField label="Runtime" value={formatRuntime(item.runtime)} />
            <DetailField label="Age Rating" value={item.ageRating} />
          </div>
        </AdminDetailsSection>

        <AdminDetailsSection title="Media Files">
          <div className="space-y-2">
            <FileField label="Thumbnail" filename={item.thumbnailFilename} />
            <FileField label="Video" filename={item.videoFilename} />
            <FileField
              label="Subtitles"
              filename={item.subtitleFilename || "—"}
            />
          </div>
        </AdminDetailsSection>
      </div>
    </AdminDetailsPanel>
  )
}

function DetailField({
  label,
  value,
  mono,
  note,
  children,
}: {
  label: string
  value?: string
  mono?: boolean
  note?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
      {children ?? (
        <p
          className={`text-sm ${mono ? "font-mono" : "font-medium"} text-white`}
        >
          {value}
          {note && (
            <span
              className="ml-1 text-xs font-normal"
              style={{ color: "#9CA3AF" }}
            >
              {note}
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function FileField({ label, filename }: { label: string; filename: string }) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg"
      style={{
        backgroundColor: "rgba(11, 7, 25, 0.5)",
        border: "1px solid #374151",
      }}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "#9CA3AF" }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          {label}
        </p>
        <p className="text-xs font-mono text-white truncate">
          {filename || "—"}
        </p>
      </div>
    </div>
  )
}

function AvailBadge({ status }: { status: Content["availability"] }) {
  const active = status === "available"

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: active
          ? "rgba(124, 58, 237, 0.15)"
          : "rgba(55, 65, 81, 0.4)",

        border: `1px solid ${active ? "rgba(124, 58, 237, 0.4)" : "#374151"}`,

        color: active ? "#A78BFA" : "#9CA3AF",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: active ? "#7C3AED" : "#6B7280" }}
        aria-hidden="true"
      />
      {active ? "Available" : "Unavailable"}
    </span>
  )
}

// Reusable filter select

function FilterSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  const labels: Record<string, string> = {
    "cat-filter": "Filter by category",
    "genre-filter": "Filter by genre",
    "year-filter": "Filter by release year",
    "avail-filter": "Filter by availability",
  }
  return (
    <select
      id={id}
      aria-label={labels[id] ?? "Filter content"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="content-command-bar__select"
    >
      {children}
    </select>
  )
}

function formatSyncedAt(value: string) {
  if (!value) return "Not available"
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)
}

export default function ContentTab({
  content,
  categories,
  genres,
  onAdd,
  onEdit,
  onDelete,
  addToast,
  addRequest = 0,
}: ContentTabProps) {
  const [search, setSearch] = useState("")

  const [catFilter, setCatFilter] = useState("")

  const [genreFilter, setGenreFilter] = useState("")

  const [yearFilter, setYearFilter] = useState("")
  const [availFilter, setAvailFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<string | null>(null)

  const [editId, setEditId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<keyof Content | null>("syncedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const filtersButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (addRequest > 0) setShowAdd(true)
  }, [addRequest])

  useEffect(() => {
    if (!filtersOpen) return
    const closeFilters = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setFiltersOpen(false)
      window.requestAnimationFrame(() => filtersButtonRef.current?.focus())
    }
    document.addEventListener("keydown", closeFilters)
    return () => document.removeEventListener("keydown", closeFilters)
  }, [filtersOpen])

  const years = useMemo(() => {
    const ys = [...new Set(content.map((c) => c.releaseYear))].sort(
      (a, b) => b - a,
    )

    return ys
  }, [content])

  const filtered = useMemo(() => {
    let rows = content

    if (search)
      rows = rows.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase()),
      )

    if (catFilter) rows = rows.filter((c) => c.categoryId === catFilter)

    if (genreFilter) rows = rows.filter((c) => c.genreIds.includes(genreFilter))

    if (yearFilter)
      rows = rows.filter((c) => c.releaseYear === parseInt(yearFilter))

    if (availFilter) rows = rows.filter((c) => c.availability === availFilter)

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey],
          bv = b[sortKey]

        let comparison = 0
        if (sortKey === "syncedAt") {
          if (!a.syncedAt && b.syncedAt) return 1
          if (a.syncedAt && !b.syncedAt) return -1
          const aTime = a.syncedAt ? Date.parse(a.syncedAt) : 0
          const bTime = b.syncedAt ? Date.parse(b.syncedAt) : 0
          comparison = aTime - bTime
        } else if (typeof av === "number" && typeof bv === "number")
          comparison = av - bv
        else comparison = String(av).localeCompare(String(bv))
        if (comparison === 0)
          comparison = a.id.localeCompare(b.id, undefined, { numeric: true })
        return sortDir === "asc" ? comparison : -comparison
      })
    }

    return rows
  }, [
    content,
    search,
    catFilter,
    genreFilter,
    yearFilter,
    availFilter,
    sortKey,
    sortDir,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  )
  const activeFilterCount = [
    catFilter,
    genreFilter,
    yearFilter,
    availFilter,
  ].filter(Boolean).length

  function resetFilters() {
    setSearch("")
    setCatFilter("")
    setGenreFilter("")
    setYearFilter("")
    setAvailFilter("")
    setPage(1)
  }

  function clearFilterSelections() {
    setCatFilter("")
    setGenreFilter("")
    setYearFilter("")
    setAvailFilter("")
    setPage(1)
  }

  function handleSort(key: keyof Content) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function handleCommandSort(value: string) {
    const [key, direction] = value.split(":") as [keyof Content, "asc" | "desc"]
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  function SortIcon({ col }: { col: keyof Content }) {
    const active = sortKey === col

    return (
      <span className="content-table__sort-icon" aria-hidden="true">
        <svg
          className={active && sortDir === "asc" ? "is-active" : ""}
          fill="currentColor"
          viewBox="0 0 10 10"
        >
          <path d="M5 0l5 5H0z" />
        </svg>
        <svg
          className={active && sortDir === "desc" ? "is-active" : ""}
          fill="currentColor"
          viewBox="0 0 10 10"
        >
          <path d="M0 5l5 5 5-5z" />
        </svg>
      </span>
    )
  }

  function SortableHeader({
    label,
    col,
    align = "left",
  }: {
    label: string
    col: keyof Content
    align?: "left" | "right"
  }) {
    const active = sortKey === col

    return (
      <th
        scope="col"
        className={`content-table__head-cell ${
          align === "right" ? "content-table__head-cell--right" : ""
        }`}
        aria-sort={
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          className="content-table__sort-button"
          onClick={() => handleSort(col)}
          aria-label={`Sort by ${label}${
            active
              ? `, currently ${sortDir === "asc" ? "ascending" : "descending"}`
              : ""
          }`}
        >
          {label}
          <SortIcon col={col} />
        </button>
      </th>
    )
  }

  const detailItem = detailId ? content.find((c) => c.id === detailId) : null

  const editItem = editId ? content.find((c) => c.id === editId) : null

  const deleteItem = deleteId ? content.find((c) => c.id === deleteId) : null

  return (
    <div>
      <section
        className="content-command-bar"
        aria-label="Content library controls"
      >
        <div className="content-command-bar__search">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#9CA3AF" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search title or content ID…"
            aria-label="Search content"
            className="content-command-bar__input"
          />
        </div>
        <button
          ref={filtersButtonRef}
          type="button"
          className={`content-command-bar__button${
            filtersOpen || activeFilterCount > 0 ? " is-active" : ""
          }`}
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="content-library-filters"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 5h16l-6.3 7.1v5.1l-3.4 1.8v-6.9Z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          className="content-command-bar__select"
          aria-label="Sort content"
          value={`${sortKey ?? "title"}:${sortKey ? sortDir : "asc"}`}
          onChange={(event) => handleCommandSort(event.target.value)}
        >
          <option value="title:asc">Title A–Z</option>
          <option value="title:desc">Title Z–A</option>
          <option value="syncedAt:desc">Newest first</option>
          <option value="syncedAt:asc">Oldest first</option>
          <option value="totalStreams:desc">Most streamed</option>
        </select>
        <div className="content-view-toggle" aria-label="Content view">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Show list view"
            title="List view"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M9 6h11M9 12h11M9 18h11" />
              <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
              <circle
                cx="4.5"
                cy="12"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="4.5"
                cy="18"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Show grid view"
            title="Grid view"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
        <span className="content-command-bar__count">
          {filtered.length} {filtered.length === 1 ? "title" : "titles"}
        </span>
      </section>

      {(filtersOpen || activeFilterCount > 0) && (
        <div id="content-library-filters" className="content-filter-strip">
          <FilterSelect
            id="cat-filter"
            value={catFilter}
            onChange={(v) => {
              setCatFilter(v)
              setPage(1)
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="genre-filter"
            value={genreFilter}
            onChange={(v) => {
              setGenreFilter(v)
              setPage(1)
            }}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="year-filter"
            value={yearFilter}
            onChange={(v) => {
              setYearFilter(v)
              setPage(1)
            }}
          >
            <option value="">All Release Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="avail-filter"
            value={availFilter}
            onChange={(v) => {
              setAvailFilter(v)
              setPage(1)
            }}
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </FilterSelect>
          <button
            type="button"
            onClick={clearFilterSelections}
            disabled={activeFilterCount === 0}
            className="btn-violet focus-ring admin-reset-filters"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" ? (
        <div className="content-table-frame">
          <div className="content-table-frame__heading">
            <h2>All titles</h2>
            <span>{filtered.length}</span>
          </div>
          <div className="content-table-scroll scrollbar-thin">
            <table className="content-admin-table">
              <colgroup>
                <col className="content-table__col-title" />
                <col className="content-table__col-genres" />
                <col className="content-table__col-year" />
                <col className="content-table__col-runtime" />
                <col className="content-table__col-rating" />
                <col className="content-table__col-streams" />
                <col className="content-table__col-status" />
                <col className="content-table__col-date" />
                <col className="content-table__col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="content-table__head-cell">
                    Title
                  </th>
                  <th scope="col" className="content-table__head-cell">
                    Genres
                  </th>
                  <th scope="col" className="content-table__head-cell admin-table-head--emphasis">
                    Year
                  </th>
                  <th scope="col" className="content-table__head-cell admin-table-head--emphasis">
                    Runtime
                  </th>
                  <th
                    scope="col"
                    className="content-table__head-cell content-table__head-cell--center admin-table-head--emphasis"
                  >
                    Rating
                  </th>
                  <th
                    scope="col"
                    className="content-table__head-cell content-table__head-cell--right admin-table-head--emphasis"
                  >
                    Streams
                  </th>
                  <th scope="col" className="content-table__head-cell">
                    Availability
                  </th>
                  <SortableHeader label="Last synced" col="syncedAt" />
                  <th scope="col" className="content-table__head-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          className="w-10 h-10 opacity-30"
                          style={{ color: "#9CA3AF" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                          />
                        </svg>
                        <p className="text-sm" style={{ color: "#9CA3AF" }}>
                          {content.length === 0
                            ? "No content has been added yet."
                            : "No records match your search or selected filters."}
                        </p>
                        {content.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            className="btn-primary flex items-center gap-2 px-5 py-2.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Content
                          </button>
                        ) : (
                          <button
                            onClick={resetFilters}
                            className="btn-violet focus-ring admin-reset-filters"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {paginated.map((item) => {
                  const cat = categories.find((c) => c.id === item.categoryId)

                  const itemGenres = genres.filter((g) =>
                    item.genreIds.includes(g.id),
                  )

                  const isSelected = selectedId === item.id

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(isSelected ? null : item.id)}
                      className={`content-table__row ${
                        isSelected ? "is-selected" : ""
                      }`}
                    >
                      <td>
                        <div className="content-table__title-cell">
                          <button
                            type="button"
                            className="content-table__thumbnail"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailId(item.id)
                            }}
                            aria-label={`View details for ${item.title}`}
                          >
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span
                                className="content-table__thumbnail-placeholder"
                                aria-hidden="true"
                              >
                                ▶
                              </span>
                            )}
                          </button>
                          <span className="content-table__title-copy">
                            <span
                              className="content-table__title"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span
                              className="content-table__title-meta"
                              title={`ID ${item.id} · ${cat?.name ?? "Uncategorized"}`}
                            >
                              ID {item.id} · {cat?.name ?? "Uncategorized"}
                            </span>
                          </span>
                        </div>
                      </td>
                      {/* Genres */}
                      <td>
                        <div
                          className="content-table__genres"
                          title={itemGenres.map((g) => g.name).join(", ")}
                        >
                          {itemGenres.slice(0, 2).map((g) => (
                            <span
                              key={g.id}
                              className="content-table__genre-badge"
                            >
                              {g.name}
                            </span>
                          ))}
                          {itemGenres.length > 2 && (
                            <span className="content-table__genre-more">
                              +{itemGenres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Year */}
                      <td className="content-table__compact">
                        {item.releaseYear}
                      </td>
                      {/* Runtime */}
                      <td className="content-table__compact content-table__muted">
                        {formatRuntime(item.runtime)}
                      </td>
                      {/* Rating */}
                      <td className="content-table__center">
                        <span className={`content-table__rating-badge ${ratingClass(item.ageRating)}`}>
                          {item.ageRating}
                        </span>
                      </td>
                      {/* Streams */}
                      <td className="content-table__streams">
                        {formatStreams(item.totalStreams)}
                      </td>
                      {/* Status */}
                      <td>
                        <AvailBadge status={item.availability} />
                      </td>
                      <td
                        className="content-table__date"
                        title={item.syncedAt || "Timestamp not available"}
                      >
                        {formatSyncedAt(item.syncedAt)}
                      </td>
                      {/* Actions */}
                      <td>
                        <div
                          className="content-table__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AdminRowAction
                            action="view"
                            name={item.title}
                            onClick={() => setDetailId(item.id)}
                          />
                          <AdminRowAction
                            action="edit"
                            name={item.title}
                            onClick={() => setEditId(item.id)}
                          />
                          <AdminRowAction
                            action="delete"
                            name={item.title}
                            onClick={() => setDeleteId(item.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <AdminTablePagination
            page={safePage}
            total={filtered.length}
            perPage={rowsPerPage}
            onPage={setPage}
            onPerPage={(amount) => {
              setRowsPerPage(amount)
              setPage(1)
            }}
            label="titles"
          />
          <div
            className="hidden"
            style={{
              borderTop: "1px solid #374151",
              backgroundColor: "rgba(11, 7, 25, 0.3)",
            }}
          >
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Showing{" "}
              {filtered.length === 0
                ? "0"
                : `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, filtered.length)}`}{" "}
              of {filtered.length} titles
            </p>
            <div className="flex items-center gap-1">
              <label className="content-rows-select">
                Rows
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value))
                    setPage(1)
                  }}
                  aria-label="Rows per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <PageBtn
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </PageBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i + 1

                if (totalPages > 7) {
                  if (i === 5)
                    return (
                      <span
                        key="ellipsis"
                        className="px-1 text-xs"
                        style={{ color: "#9CA3AF" }}
                      >
                        …
                      </span>
                    )

                  if (i === 6) p = totalPages
                }

                return (
                  <PageBtn
                    key={p}
                    onClick={() => setPage(p)}
                    active={safePage === p}
                    aria-label={`Page ${p}`}
                    aria-current={safePage === p ? "page" : undefined}
                  >
                    {p}
                  </PageBtn>
                )
              })}
              <PageBtn
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </PageBtn>
            </div>
          </div>
        </div>
      ) : (
        <div className="content-grid-view">
          <div className="content-card-grid" aria-label="Content grid">
            {paginated.map((item) => {
              const cat = categories.find(
                (category) => category.id === item.categoryId,
              )
              return (
                <article key={item.id} className="content-card">
                  <button
                    type="button"
                    className="content-card__media"
                    onClick={() => setDetailId(item.id)}
                    aria-label={`View details for ${item.title}`}
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" />
                    ) : (
                      <span aria-hidden="true">▶</span>
                    )}
                  </button>
                  <div className="content-card__body">
                    <div>
                      <h3 title={item.title}>{item.title}</h3>
                      <p>
                        ID {item.id} · {cat?.name ?? "Uncategorized"}
                      </p>
                    </div>
                    <div className="content-card__meta">
                      <span>{item.releaseYear}</span>
                      <span>{formatRuntime(item.runtime)}</span>
                      <span>{formatStreams(item.totalStreams)} streams</span>
                      <span title={item.syncedAt || "Timestamp not available"}>
                        Last synced: {formatSyncedAt(item.syncedAt)}
                      </span>
                    </div>
                    <div className="content-card__footer">
                      <AvailBadge status={item.availability} />
                      <div className="content-table__actions">
                        <AdminRowAction
                          action="view"
                          name={item.title}
                          onClick={() => setDetailId(item.id)}
                        />
                        <AdminRowAction
                          action="edit"
                          name={item.title}
                          onClick={() => setEditId(item.id)}
                        />
                        <AdminRowAction
                          action="delete"
                          name={item.title}
                          onClick={() => setDeleteId(item.id)}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
            {paginated.length === 0 && (
              <div className="content-card-grid__empty">
                <p>
                  {content.length === 0
                    ? "No content has been added yet."
                    : "No titles match the current search and filters."}
                </p>
                <button
                  type="button"
                  className={content.length === 0 ? "btn-primary flex items-center gap-2 px-5 py-2.5" : undefined}
                  onClick={
                    content.length === 0 ? () => setShowAdd(true) : resetFilters
                  }
                >
                  {content.length === 0 && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {content.length === 0 ? "Add title" : "Clear filters"}
                </button>
              </div>
            )}
          </div>
          <AdminTablePagination
            page={safePage}
            total={filtered.length}
            perPage={rowsPerPage}
            onPage={setPage}
            onPerPage={(amount) => {
              setRowsPerPage(amount)
              setPage(1)
            }}
            label="titles"
          />
          <div className="admin-table-pagination hidden">
            <p>
              Showing{" "}
              {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1}–
              {Math.min(safePage * rowsPerPage, filtered.length)} of{" "}
              {filtered.length} titles
            </p>
            <div className="admin-pagination-controls">
              <label className="content-rows-select">
                Rows
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value))
                    setPage(1)
                  }}
                  aria-label="Rows per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage === 1}
                aria-label="Previous content page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, safePage - 3), Math.max(5, safePage + 2))
                .map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={safePage === pageNumber ? "is-active" : ""}
                    aria-current={safePage === pageNumber ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={safePage === totalPages}
                aria-label="Next content page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          categories={categories}
          genres={genres}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null)
            setEditId(detailItem.id)
          }}
          onDelete={() => {
            setDeleteId(detailItem.id)
            setDetailId(null)
          }}
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
              onAdd(data)

              setShowAdd(false)

              addToast("Content added successfully.", "success")
            }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title="Edit Content" onClose={() => setEditId(null)} wide>
          <ContentForm
            initial={{
              title: editItem.title,
              categoryId: editItem.categoryId,
              genreIds: editItem.genreIds,

              synopsis: editItem.synopsis,
              releaseYear: editItem.releaseYear,
              runtime: editItem.runtime,

              ageRating: editItem.ageRating,
              thumbnailUrl: editItem.thumbnailUrl,
              thumbnailFilename: editItem.thumbnailFilename,

              videoFilename: editItem.videoFilename,
              subtitleFilename: editItem.subtitleFilename,

              availability: editItem.availability,
            }}
            categories={categories}
            genres={genres}
            submitLabel="Save Changes"
            readOnlyId={editItem.id}
            readOnlyStreams={editItem.totalStreams}
            onCancel={() => setEditId(null)}
            onSubmit={async (data) => {
              await onEdit({ ...editItem, ...data })

              setEditId(null)

              addToast("Content updated successfully.", "success")
            }}
            onDelete={() => {
              setDeleteId(editItem.id)
              setEditId(null)
            }}
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
            onDelete(deleteItem.id)

            setDeleteId(null)

            addToast(`"${deleteItem.title}" deleted.`, "success")
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

function PageBtn({
  children,
  onClick,
  disabled,
  active,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean

  "aria-label"?: string
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className="w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors disabled:opacity-40"
      style={{
        backgroundColor: active ? "#7C3AED" : "transparent",

        color: active ? "#fff" : "#9CA3AF",

        border: `1px solid ${active ? "#7C3AED" : "#374151"}`,
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.backgroundColor = "rgba(124, 58, 237, 0.2)"
          e.currentTarget.style.color = "#fff"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "#9CA3AF"
        }
      }}
    >
      {children}
    </button>
  )
}
