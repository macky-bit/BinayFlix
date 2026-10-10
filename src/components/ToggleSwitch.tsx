import styles from "./ToggleSwitch.module.css"

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  ariaLabel: string
  className?: string
  disabled?: boolean
}

export default function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`${styles.toggle} ${
        checked ? styles.toggleOn : styles.toggleOff
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`${styles.toggleThumb} ${
          checked ? styles.toggleThumbOn : ""
        }`}
      />
    </button>
  )
}
