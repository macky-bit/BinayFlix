import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import { createPortal } from "react-dom"

import styles from "./StreamFlixSelect.module.css"

type StreamFlixSelectProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
  ariaLabel: string
  fullWidth?: boolean
  disabled?: boolean
}

type MenuPosition = {
  placement: "top" | "bottom"
  style: CSSProperties
}

const MENU_GAP = 6
const VIEWPORT_MARGIN = 10
const MAX_MENU_HEIGHT = 196
const OPTION_HEIGHT = 34

export default function StreamFlixSelect({
  value,
  options,
  onChange,
  ariaLabel,
  fullWidth = false,
  disabled = false,
}: StreamFlixSelectProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(0, options.indexOf(value)),
  )
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeaheadRef = useRef("")
  const typeaheadTimerRef = useRef<number | null>(null)
  const listboxId = useId()
  const menuReady = menuPosition !== null

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const bounds = trigger.getBoundingClientRect()
      const scale = Math.max(1, bounds.width / trigger.offsetWidth)
      const viewportWidth = window.innerWidth / scale
      const viewportHeight = window.innerHeight / scale
      const triggerBounds = {
        top: bounds.top / scale,
        bottom: bounds.bottom / scale,
        left: bounds.left / scale,
        width: bounds.width / scale,
      }
      const desiredHeight = Math.min(
        options.length * OPTION_HEIGHT + 10,
        MAX_MENU_HEIGHT,
      )
      const spaceBelow =
        viewportHeight - triggerBounds.bottom - MENU_GAP - VIEWPORT_MARGIN
      const spaceAbove = triggerBounds.top - MENU_GAP - VIEWPORT_MARGIN
      const placement =
        spaceBelow < Math.min(desiredHeight, 128) && spaceAbove > spaceBelow
          ? "top"
          : "bottom"
      const availableSpace = placement === "top" ? spaceAbove : spaceBelow
      const maxHeight = Math.max(
        OPTION_HEIGHT + 10,
        Math.min(MAX_MENU_HEIGHT, availableSpace),
      )
      const renderedHeight = Math.min(desiredHeight, maxHeight)
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, triggerBounds.left),
        viewportWidth - triggerBounds.width - VIEWPORT_MARGIN,
      )
      const top =
        placement === "top"
          ? triggerBounds.top - MENU_GAP - renderedHeight
          : triggerBounds.bottom + MENU_GAP

      setMenuPosition({
        placement,
        style: {
          top,
          left,
          width: triggerBounds.width,
          maxHeight,
        },
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return

    const selectedIndex = options.indexOf(value)
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick)
  }, [open, options, value])

  useEffect(() => {
    if (open && menuReady) {
      requestAnimationFrame(() => listRef.current?.focus())
    }
  }, [open, menuReady])

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== null) {
        window.clearTimeout(typeaheadTimerRef.current)
      }
    },
    [],
  )

  const selectOption = (option: string) => {
    onChange(option)
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((current) => {
      const next = current + direction
      if (next < 0) return options.length - 1
      if (next >= options.length) return 0
      return next
    })
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
    }
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      setHighlightedIndex(0)
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      setHighlightedIndex(options.length - 1)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const option = options[highlightedIndex]
      if (option !== undefined) selectOption(option)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (event.key === "Tab") {
      setOpen(false)
      return
    }

    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      typeaheadRef.current += event.key.toLowerCase()
      const matchIndex = options.findIndex((option) =>
        option.toLowerCase().startsWith(typeaheadRef.current),
      )
      if (matchIndex >= 0) setHighlightedIndex(matchIndex)

      if (typeaheadTimerRef.current !== null) {
        window.clearTimeout(typeaheadTimerRef.current)
      }
      typeaheadTimerRef.current = window.setTimeout(() => {
        typeaheadRef.current = ""
      }, 500)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${fullWidth ? styles.fullWidth : ""}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={`${ariaLabel}: ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.value}>{value}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open &&
        menuPosition &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={`${listboxId}-option-${highlightedIndex}`}
            className={styles.menu}
            data-placement={menuPosition.placement}
            style={menuPosition.style}
            onKeyDown={handleListKeyDown}
          >
            {options.map((option, index) => {
              const selected = option === value
              const highlighted = index === highlightedIndex

              return (
                <li
                  id={`${listboxId}-option-${index}`}
                  key={option}
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option} ${
                    highlighted ? styles.optionHighlighted : ""
                  } ${selected ? styles.optionSelected : ""}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  <span>{option}</span>
                  {selected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>,
          document.getElementById("root") ?? document.body,
        )}
    </div>
  )
}
