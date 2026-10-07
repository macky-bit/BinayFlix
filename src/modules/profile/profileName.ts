export const MAX_PROFILE_NAME_LENGTH = 50

export function normalizeProfileName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized) throw new Error("Enter a profile name.")
  if (normalized.length > MAX_PROFILE_NAME_LENGTH) {
    throw new Error(`Profile name must be ${MAX_PROFILE_NAME_LENGTH} characters or fewer.`)
  }
  return normalized
}
