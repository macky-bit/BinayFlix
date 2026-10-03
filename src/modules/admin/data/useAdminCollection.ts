import { useCallback, useEffect, useState } from "react"

import type { AdminEntity, AdminListQuery, AdminRepository } from "./contracts"

export interface UseAdminCollectionOptions<T> {
  enabled?: boolean
  initialItems?: T[]
  query?: Omit<AdminListQuery, "signal">
}

export interface AdminCollectionState<T extends AdminEntity> {
  items: T[]
  total: number
  loading: boolean
  mutating: boolean
  error: Error | null
  reload: () => Promise<void>
  create: (input: Omit<T, "id">) => Promise<T>
  update: (id: string, input: Partial<Omit<T, "id">>) => Promise<T>
  remove: (id: string) => Promise<void>
}

/** Keeps server state and CRUD requests outside presentation components. */
export function useAdminCollection<T extends AdminEntity>(
  repository: AdminRepository<T>,
  options: UseAdminCollectionOptions<T> = {},
): AdminCollectionState<T> {
  const { enabled = true, initialItems = [], query } = options
  const [items, setItems] = useState<T[]>(initialItems)
  const [total, setTotal] = useState(initialItems.length)
  const [loading, setLoading] = useState(enabled)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) return
      setLoading(true)
      setError(null)
      try {
        const page = await repository.list({ ...query, signal })
        setItems(page.items)
        setTotal(page.total)
      } catch (reason) {
        if (signal?.aborted) return
        setError(reason instanceof Error ? reason : new Error("Request failed"))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [enabled, query, repository],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const reload = useCallback(async () => load(), [load])

  const create = useCallback(
    async (input: Omit<T, "id">) => {
      setMutating(true)
      setError(null)
      try {
        const created = await repository.create(input)
        setItems((current) => [created, ...current])
        setTotal((current) => current + 1)
        return created
      } catch (reason) {
        const requestError =
          reason instanceof Error ? reason : new Error("Create failed")
        setError(requestError)
        throw requestError
      } finally {
        setMutating(false)
      }
    },
    [repository],
  )

  const update = useCallback(
    async (id: string, input: Partial<Omit<T, "id">>) => {
      setMutating(true)
      setError(null)
      try {
        const updated = await repository.update(id, input)
        setItems((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        )
        return updated
      } catch (reason) {
        const requestError =
          reason instanceof Error ? reason : new Error("Update failed")
        setError(requestError)
        throw requestError
      } finally {
        setMutating(false)
      }
    },
    [repository],
  )

  const remove = useCallback(
    async (id: string) => {
      setMutating(true)
      setError(null)
      try {
        await repository.remove(id)
        setItems((current) => current.filter((item) => item.id !== id))
        setTotal((current) => Math.max(0, current - 1))
      } catch (reason) {
        const requestError =
          reason instanceof Error ? reason : new Error("Delete failed")
        setError(requestError)
        throw requestError
      } finally {
        setMutating(false)
      }
    },
    [repository],
  )

  return {
    items,
    total,
    loading,
    mutating,
    error,
    reload,
    create,
    update,
    remove,
  }
}
