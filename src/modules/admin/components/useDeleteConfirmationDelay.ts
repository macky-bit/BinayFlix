import { useCallback, useEffect, useRef, useState } from "react"

import { ADMIN_DELETE_DELAY_MS } from "../data/adminEditDelay"

export function useDeleteConfirmationDelay(
  onConfirm: () => void,
  enabled = true,
) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const onConfirmRef = useRef(onConfirm)

  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  useEffect(() => {
    if (secondsRemaining === null) return
    if (secondsRemaining === 0) {
      setSecondsRemaining(null)
      onConfirmRef.current()
      return
    }

    const timer = globalThis.setTimeout(
      () =>
        setSecondsRemaining((seconds) =>
          seconds === null ? null : seconds - 1,
        ),
      1000,
    )
    return () => globalThis.clearTimeout(timer)
  }, [secondsRemaining])

  const beginConfirmation = useCallback(() => {
    if (!enabled) {
      onConfirmRef.current()
      return
    }

    setSecondsRemaining((seconds) =>
      seconds === null ? Math.ceil(ADMIN_DELETE_DELAY_MS / 1000) : seconds,
    )
  }, [enabled])

  return {
    beginConfirmation,
    secondsRemaining,
    waiting: secondsRemaining !== null,
  }
}
