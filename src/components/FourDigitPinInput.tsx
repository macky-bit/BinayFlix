import { useEffect, useRef } from "react"

interface FourDigitPinInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export default function FourDigitPinInput({
  label,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: FourDigitPinInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const focusDigit = (index: number) => {
    const input = inputs.current[Math.max(0, Math.min(index, 3))]
    input?.focus()
    input?.select()
  }

  useEffect(() => {
    if (autoFocus && !value && !disabled) focusDigit(0)
  }, [autoFocus, disabled, value])

  const enterDigits = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return
    const start = digits.length === 4 ? 0 : Math.min(index, value.length)
    onChange((value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, 4))
    focusDigit(Math.min(start + digits.length, 3))
  }

  return (
    <fieldset className="mx-auto w-full max-w-[16rem] min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-taupe)]">{label}</legend>
      <div className="grid w-full grid-cols-4 gap-2" aria-label={label}>
        {Array.from({ length: 4 }, (_, index) => (
          <input
            key={index}
            ref={(element) => { inputs.current[index] = element }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={1}
            value={value[index] ?? ""}
            disabled={disabled}
            aria-label={`${label}, digit ${index + 1} of 4`}
            className="aspect-square w-full min-w-0 rounded-md border border-white/30 bg-black/20 text-center text-xl font-semibold text-white outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 disabled:opacity-50"
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "")
              if (digits) enterDigits(index, digits)
              else if (index < value.length) onChange(value.slice(0, index) + value.slice(index + 1))
            }}
            onPaste={(event) => {
              event.preventDefault()
              enterDigits(index, event.clipboardData.getData("text"))
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") { event.preventDefault(); focusDigit(index - 1) }
              if (event.key === "ArrowRight") { event.preventDefault(); focusDigit(index + 1) }
              if (event.key === "Backspace") {
                event.preventDefault()
                const removeAt = index < value.length ? index : Math.min(index - 1, value.length - 1)
                if (removeAt >= 0) {
                  onChange(value.slice(0, removeAt) + value.slice(removeAt + 1))
                  focusDigit(removeAt)
                }
              }
              if (event.key === "Delete" && index < value.length) {
                event.preventDefault()
                onChange(value.slice(0, index) + value.slice(index + 1))
              }
            }}
          />
        ))}
      </div>
    </fieldset>
  )
}
