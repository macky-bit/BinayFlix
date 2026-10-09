import { useEffect } from "react"

import { HelpView } from "./components"

import styles from "./help.module.css"

interface Props {
  onBack: () => void
}

export default function HelpPage({ onBack }: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const root = document.getElementById("root")
    const previousRootZoom = root?.style.getPropertyValue("zoom") ?? ""
    document.body.style.overflow = "hidden"
    root?.style.setProperty("zoom", "1")

    return () => {
      document.body.style.overflow = previousOverflow
      if (previousRootZoom) root?.style.setProperty("zoom", previousRootZoom)
      else root?.style.removeProperty("zoom")
    }
  }, [])

  return (
    <div className={styles.moduleShell}>
      <HelpView onBack={onBack} />
    </div>
  )
}
