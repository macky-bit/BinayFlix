import { useRef } from "react"

export default function AdminContentFilePicker({
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
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
