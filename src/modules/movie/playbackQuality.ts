export type PlaybackQuality = 480 | 720 | 1080

export const PLAYBACK_QUALITIES: readonly PlaybackQuality[] = [480, 720, 1080]

export const PLAYBACK_SOURCE_BY_QUALITY: Record<PlaybackQuality, string> = {
  480: "/media/480MovieStudioLogo.mp4",
  720: "/media/720MovieStudioLogo.mp4",
  1080: "/media/1080MovieStudioLogo.mp4",
}

export function playbackQualitiesForPlan(
  planName: string | null | undefined,
): PlaybackQuality[] {
  switch (planName?.trim().toLowerCase()) {
    case "premium":
      return [480, 720, 1080]
    case "standard":
      return [480, 720]
    default:
      return [480]
  }
}

export function preferredPlaybackQuality(
  planName: string | null | undefined,
): PlaybackQuality {
  return playbackQualitiesForPlan(planName).at(-1) ?? 480
}

export function requiredPlanForQuality(quality: PlaybackQuality) {
  if (quality === 1080) return "Premium"
  if (quality === 720) return "Standard"
  return "Basic"
}
