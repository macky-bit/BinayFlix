import { useEffect, useState } from "react"

import { tmdb, toShow } from "../movie/tmdb"

import { showIdentity, type Show } from "../movie/types"

type MediaType = "movie" | "tv"

type WindowName = "thisWeek" | "nextWeek" | "worthTheWait"

interface UpcomingTitle {
  show: Show

  date: string

  popularity: number
}

interface UpcomingState {
  thisWeek: UpcomingTitle[]

  nextWeek: UpcomingTitle[]

  worthTheWait: UpcomingTitle[]

  loading: boolean
}

type TMDBItem = Record<string, unknown> & {
  release_date?: string

  first_air_date?: string

  popularity?: number
}

function dateString(date: Date) {
  const year = date.getFullYear()

  const month = String(date.getMonth() + 1).padStart(2, "0")

  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)

  next.setDate(next.getDate() + days)

  return next
}

export function useUpcomingTMDB(): UpcomingState {
  const [state, setState] = useState<UpcomingState>({
    thisWeek: [],
    nextWeek: [],
    worthTheWait: [],
    loading: true,
  })

  useEffect(() => {
    let active = true

    const today = new Date()

    const thisSunday = addDays(today, (7 - today.getDay()) % 7)

    const nextMonday = addDays(thisSunday, 1)

    const nextSunday = addDays(thisSunday, 7)

    const laterStart = addDays(nextSunday, 1)

    const laterEnd = addDays(laterStart, 180)

    const windows: Array<{ name: WindowName; start: Date; end: Date }> = [
      { name: "thisWeek", start: today, end: thisSunday },

      { name: "nextWeek", start: nextMonday, end: nextSunday },

      { name: "worthTheWait", start: laterStart, end: laterEnd },
    ]

    async function load() {
      const results = await Promise.all(
        windows.flatMap(({ name, start, end }) =>
          (["movie", "tv"] as const).map(async (mediaType) => {
            const dateField =
              mediaType === "movie" ? "primary_release_date" : "first_air_date"

            const items = await tmdb<TMDBItem>(`/discover/${mediaType}`, {
              [`${dateField}.gte`]: dateString(start),

              [`${dateField}.lte`]: dateString(end),

              sort_by: "popularity.desc",

              include_adult: "false",
            })

            return {
              name,
              mediaType,
              items,
              start: dateString(start),
              end: dateString(end),
            }
          }),
        ),
      )

      if (!active) return

      const groups: Record<WindowName, UpcomingTitle[]> = {
        thisWeek: [],
        nextWeek: [],
        worthTheWait: [],
      }

      for (const { name, mediaType, items, start, end } of results) {
        for (const item of items) {
          const date =
            mediaType === "movie" ? item.release_date : item.first_air_date

          if (!date || date < start || date > end) continue

          const show = toShow(item, false, mediaType as MediaType)

          if (show.title && show.image)
            groups[name].push({
              show,
              date,
              popularity: Number(item.popularity ?? 0),
            })
        }
      }

      for (const window of windows) {
        const group = groups[window.name]

        const seen = new Set<string>()

        groups[window.name] = group

          .sort((a, b) =>
            window.name === "worthTheWait"
              ? b.popularity - a.popularity
              : a.date.localeCompare(b.date),
          )

          .filter(({ show }) => {
            const key = showIdentity(show)

            if (seen.has(key)) return false

            seen.add(key)

            return true
          })

          .slice(0, 8)
      }

      setState({ ...groups, loading: false })
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return state
}

export type { UpcomingTitle }
