import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Patch BigInt serialization globally for JSON.stringify
if (typeof (BigInt.prototype as any).toJSON !== 'function') {
  ;(BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
  meta?: Record<string, unknown>
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data, meta }, { status })
}

export function apiError(message: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse>({ success: false, error: message, errors }, { status })
}

export function apiUnauthorized() {
  return apiError('Unauthorized', 401)
}

export function apiForbidden() {
  return apiError('Forbidden', 403)
}

export function apiNotFound(entity = 'Resource') {
  return apiError(`${entity} not found`, 404)
}

export function apiConflict(message: string) {
  return apiError(message, 409)
}

export function apiServerError(error?: unknown) {
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const key = issue.path.join('.')
      errors[key] = errors[key] ?? []
      errors[key].push(issue.message)
    }
    return apiError('Validation failed', 422, errors)
  }

  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return apiUnauthorized()
    if (error.message === 'FORBIDDEN') return apiForbidden()
    if (error.message === 'NOT_FOUND') return apiNotFound()

    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', error)
      return apiError(`Internal error: ${error.message}`, 500)
    }
  }

  console.error('[API Error]', error)
  return apiError('Internal server error', 500)
}

/**
 * Wraps an API handler with standard error handling.
 * Usage: export const GET = withApiHandler(async (req) => { ... })
 */
export function withApiHandler<T>(
  handler: (req: Request) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      return apiServerError(error)
    }
  }
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(url: string | URL) {
  const { searchParams } = new URL(url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage') ?? 20)))
  const skip = (page - 1) * perPage
  return { page, perPage, skip, take: perPage }
}

/**
 * Parse search/filter params from URL.
 */
export function parseSearchParams(url: string | URL) {
  const { searchParams } = new URL(url)
  return {
    q: searchParams.get('q') ?? '',
    sortBy: searchParams.get('sortBy') ?? 'createdAt',
    sortDir: (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc',
    ...Object.fromEntries(searchParams.entries()),
  }
}
