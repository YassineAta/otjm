import { useMemo, useState } from 'react'

/**
 * Search + select-filter state for admin list pages.
 *
 * - `search` matches case-insensitively against the given string keys.
 * - `filters` holds one string value per filter name, defaulting to 'all'
 *   (= no filtering); any other value runs the matching predicate.
 * - `filtered` recomputes via useMemo whenever items, search or filters change.
 *
 * @example
 * const { search, setSearch, filters, setFilter, filtered } = useTableFilter(
 *   news,
 *   ['title', 'excerpt'],
 *   {
 *     category: (item, value) => item.category === value,
 *     published: (item, value) => item.published === (value === 'published'),
 *   }
 * )
 * // JSX: value={filters.category} onChange={(e) => setFilter('category', e.target.value)}
 */
export function useTableFilter<T>(
  items: T[],
  searchKeys: (keyof T)[],
  filterDefs: Record<string, (item: T, value: string) => boolean> = {}
) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.keys(filterDefs).map((name) => [name, 'all']))
  )

  const setFilter = (name: string, value: string) =>
    setFilters((prev) => ({ ...prev, [name]: value }))

  const filtered = useMemo(() => {
    let result = items

    if (search) {
      const query = search.toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          return typeof value === 'string' && value.toLowerCase().includes(query)
        })
      )
    }

    for (const [name, value] of Object.entries(filters)) {
      if (value !== 'all') {
        result = result.filter((item) => filterDefs[name](item, value))
      }
    }

    return result
    // searchKeys/filterDefs are passed as inline literals; depending on them would defeat the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filters])

  return { search, setSearch, filters, setFilter, filtered }
}
