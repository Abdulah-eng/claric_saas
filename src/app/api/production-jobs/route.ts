import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { listProductionJobs } from '@/lib/queries/production'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const sp = new URL(req.url).searchParams
    const stage = sp.get('stage') ?? undefined
    const status = sp.get('status') ?? undefined

    const { jobs, total } = await listProductionJobs(tenantId, { q, stage, status, page, perPage })
    return apiSuccess(jobs, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}
