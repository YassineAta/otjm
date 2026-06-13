import { useCallback, useEffect, useRef, useState } from 'react'
import { toastError } from '@/lib/admin-api'

interface UseAdminListOptions<T> {
  /** French description for the error toast shown when the fetch throws. */
  errorMessage?: string
  /** Optional mapping applied to the raw JSON list before storing it. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map?: (data: any[]) => T[]
}

/**
 * Fetches a JSON list for an admin page with loading state and an error toast.
 *
 * Fetches once on mount; `refetch` re-runs the same request after mutations
 * (without flipping `loading` back on, matching the original page behavior).
 * A non-OK response leaves the current items untouched; only a thrown fetch
 * error (network failure) raises the 'Erreur' toast.
 *
 * @example
 * const { items: news, loading, refetch } = useAdminList<NewsItem>('/api/news', {
 *   errorMessage: 'Impossible de charger les actualités.',
 * })
 */
export function useAdminList<T>(url: string, options: UseAdminListOptions<T> = {}) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  // Keep the latest options without retriggering the mount fetch.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const { map } = optionsRef.current
        setItems(map ? map(data) : data)
      }
    } catch {
      toastError(optionsRef.current.errorMessage ?? 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, setItems, loading, refetch }
}
