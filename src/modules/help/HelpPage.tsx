import { useEffect } from "react"

import { HelpView } from "./components"

import styles from "./help.module.css"

interface Props {
  onBack: () => void
}

export default function HelpPage({ onBack }: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div className={styles.moduleShell}>
      <HelpView onBack={onBack} />
    </div>
  )
}
