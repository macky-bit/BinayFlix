import { useState } from "react"

import { supabase } from "../../lib/supabase"
import { LOGO_SVG, PasswordField } from "./AuthUI"
import styles from "./auth.module.css"

export default function ResetPasswordPage({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirmation) { setError("Passwords do not match."); return }
    setSubmitting(true)
    setError("")
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }
    await supabase.auth.signOut()
    onComplete()
  }

  return (
    <main className={`grid min-h-screen place-items-center px-6 ${styles.page}`}>
      <section className="w-full max-w-md rounded-2xl border border-stone-700 bg-[#15111d] p-8 text-white">
        <div className="mb-8">{LOGO_SVG}</div>
        <h1 className={`text-4xl uppercase ${styles.formTitle}`}>New Password</h1>
        <p className={`mt-2 text-sm ${styles.formSubtitle}`}>Choose a new password for your StreamFlix account.</p>
        <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <p role="alert" className={`text-sm ${styles.errorText}`}>{error}</p>}
          <PasswordField id="reset-password" label="New Password" placeholder="At least 8 characters" value={password} onChange={setPassword} autoComplete="new-password" disabled={submitting} />
          <PasswordField id="reset-password-confirmation" label="Confirm Password" placeholder="Re-enter your password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" disabled={submitting} />
          <button type="submit" disabled={submitting} className={`w-full py-3 text-sm font-bold uppercase tracking-[0.15em] ${styles.submitBtn}`}>
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  )
}
