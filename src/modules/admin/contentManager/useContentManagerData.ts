import { useCallback } from "react"

import { useAdminCollection, useAdminRepository } from "../data"

import type {
  Category,
  Content,
  FilmRefresher,
  Genre,
  Soundtrack,
} from "./types"

export function useContentManagerData(onError: (message: string) => void) {
  const contentState = useAdminCollection(
    useAdminRepository<Content>("content"),
  )

  const categoryState = useAdminCollection(
    useAdminRepository<Category>("categories"),
  )

  const genreState = useAdminCollection(useAdminRepository<Genre>("genres"))

  const soundtrackState = useAdminCollection(
    useAdminRepository<Soundtrack>("soundtracks"),
  )

  const refresherState = useAdminCollection(
    useAdminRepository<FilmRefresher>("film-refreshers"),
  )

  const run = useCallback(
    async (operation: Promise<unknown>) => {
      try {
        await operation
      } catch (reason) {
        onError(
          reason instanceof Error ? reason.message : "Database request failed",
        )
      }
    },

    [onError],
  )

  return {
    content: contentState.items,

    categories: categoryState.items,

    genres: genreState.items,

    soundtracks: soundtrackState.items,

    refreshers: refresherState.items,

    loading:
      contentState.loading ||
      categoryState.loading ||
      genreState.loading ||
      soundtrackState.loading ||
      refresherState.loading,

    addContent: (item: Omit<Content, "id" | "totalStreams" | "syncedAt">) =>
      run(contentState.create({ ...item, totalStreams: 0, syncedAt: "" })),

    editContent: (item: Content) => run(contentState.update(item.id, item)),

    deleteContent: (id: string) => run(contentState.remove(id)),

    addCategory: (name: string, description: string) =>
      run(categoryState.create({ name, description, contentCount: 0 })),

    editCategory: (item: Category) => run(categoryState.update(item.id, item)),

    deleteCategory: (id: string) => run(categoryState.remove(id)),

    addGenre: (name: string, description: string) =>
      run(genreState.create({ name, description, contentCount: 0 })),

    editGenre: (item: Genre) => run(genreState.update(item.id, item)),

    deleteGenre: (id: string) => run(genreState.remove(id)),

    addSoundtrack: (item: Omit<Soundtrack, "id">) =>
      run(soundtrackState.create(item)),

    editSoundtrack: (item: Soundtrack) =>
      run(soundtrackState.update(item.id, item)),

    deleteSoundtrack: (id: string) => run(soundtrackState.remove(id)),

    addRefresher: (item: Omit<FilmRefresher, "id" | "lastUpdated">) =>
      run(
        refresherState.create({
          ...item,

          lastUpdated: new Date().toISOString().slice(0, 10),
        }),
      ),

    editRefresher: (item: FilmRefresher) =>
      run(refresherState.update(item.id, item)),

    deleteRefresher: (id: string) => run(refresherState.remove(id)),
  }
}
