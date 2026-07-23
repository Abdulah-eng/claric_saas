import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createLeadSchema } from '@/lib/validations/crm'
import { listLeads } from '@/lib/queries/crm'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const sp = new URL(req.url).searchParams
    const status = sp.get('status') ?? undefined
    const assignedToId = sp.get('assignedToId') ?? undefined

    const { leads, total } = await listLeads(tenantId, { q, status, assignedToId, page, perPage })
    return apiSuccess(leads, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createLeadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        ...data,
        estimatedValue: data.estimatedValue ? data.estimatedValue : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'CREATE',
        entity: 'Lead',
        entityId: lead.id,
        newValues: lead as any,
      },
    })

    return apiSuccess(lead, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
