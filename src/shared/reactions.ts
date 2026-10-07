export const REACTION_DEFINITIONS = [
  { key: "upvote", emoji: "👍", label: "Upvote" },
  { key: "funny", emoji: "😂", label: "Funny" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "surprised", emoji: "😮", label: "Surprised" },
  { key: "angry", emoji: "😡", label: "Angry" },
  { key: "sad", emoji: "😢", label: "Sad" },
] as const

export type ReactionKey = typeof REACTION_DEFINITIONS[number]["key"]

export function createEmptyReactionCounts(): Record<ReactionKey, number> {
  return Object.fromEntries(
    REACTION_DEFINITIONS.map(({ key }) => [key, 0]),
  ) as Record<ReactionKey, number>
}
