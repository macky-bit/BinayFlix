import type { SupabaseClient } from "@supabase/supabase-js"

export const FEEDBACK_BUCKET = "feedback-attachments"
export const MAX_FEEDBACK_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_FEEDBACK_SUBJECT_LENGTH = 50
export const MAX_FEEDBACK_DESCRIPTION_LENGTH = 200
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export function validateFeedbackText(subject: string, description: string): void {
  if (!subject.trim()) throw new Error("Please enter a subject.")
  if (subject.length > MAX_FEEDBACK_SUBJECT_LENGTH) {
    throw new Error(`Subject must be ${MAX_FEEDBACK_SUBJECT_LENGTH} characters or fewer.`)
  }
  if (!description.trim()) throw new Error("Please describe the issue.")
  if (description.length > MAX_FEEDBACK_DESCRIPTION_LENGTH) {
    throw new Error(`Description must be ${MAX_FEEDBACK_DESCRIPTION_LENGTH} characters or fewer.`)
  }
}

export function validateFeedbackImage(file: File | null): void {
  if (!file) return
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Attach a PNG, JPG, WebP, or GIF image.")
  if (file.size > MAX_FEEDBACK_IMAGE_BYTES) throw new Error("Attachments must be 5 MB or smaller.")
}

function safeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "attachment"
}

export async function submitHelpFeedback(
  client: SupabaseClient,
  input: { topic: string; subject: string; description: string; attachment: File | null },
): Promise<void> {
  validateFeedbackText(input.subject, input.description)
  validateFeedbackImage(input.attachment)
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError || !authData.user) throw new Error("Sign in to contact support.")

  const { data: account, error: accountError } = await client
    .from("user")
    .select("user_id")
    .eq("auth_user_id", authData.user.id)
    .single()
  if (accountError) throw accountError

  let attachmentPath: string | null = null
  if (input.attachment) {
    attachmentPath = `${account.user_id}/${crypto.randomUUID()}-${safeFilename(input.attachment.name)}`
    const { error: uploadError } = await client.storage
      .from(FEEDBACK_BUCKET)
      .upload(attachmentPath, input.attachment, { contentType: input.attachment.type, upsert: false })
    if (uploadError) throw uploadError
  }

  const { error: insertError } = await client.from("platform_feedback").insert({
    user_id: account.user_id,
    feedback_type: "Support Request",
    subject: input.subject.trim(),
    description: `[${input.topic}]\n${input.description.trim()}`,
    screenshot: attachmentPath,
    status: "Open",
  })
  if (!insertError) return

  if (attachmentPath) {
    await client.storage.from(FEEDBACK_BUCKET).remove([attachmentPath]).catch(() => undefined)
  }
  throw insertError
}
