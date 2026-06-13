import { toast } from '@/hooks/use-toast'

interface AdminFetchOptions {
  method?: string
  body?: unknown
  /** Message used when the server error payload carries no `error`/`message` field. */
  fallbackError?: string
}

/**
 * Error thrown by `adminFetch` for non-2xx responses, as opposed to network
 * failures which surface as plain errors. `status` carries the HTTP status.
 */
export class AdminApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

/**
 * fetch wrapper for admin CRUD calls.
 *
 * JSON-encodes `body` (with the Content-Type header) when provided. On a
 * non-2xx response it parses both `{error}` and `{message}` payload shapes
 * and throws an {@link AdminApiError} carrying the server message.
 *
 * @example
 * await adminFetch(`/api/news/${id}`, { method: 'PATCH', body: { published: true } })
 */
export async function adminFetch(url: string, options: AdminFetchOptions = {}): Promise<Response> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    ...(options.body !== undefined
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options.body),
        }
      : {}),
  })

  if (!response.ok) {
    const details = await response.json().catch(() => ({}))
    throw new AdminApiError(
      details.error || details.message || options.fallbackError || `Erreur ${response.status}`,
      response.status
    )
  }

  return response
}

/** Success toast with the standard admin title. */
export function toastSuccess(description: string) {
  toast({ title: 'Succès', description })
}

/** Destructive error toast with the standard admin title. */
export function toastError(description: string) {
  toast({ title: 'Erreur', description, variant: 'destructive' })
}
