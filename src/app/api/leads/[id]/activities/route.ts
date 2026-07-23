import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { createLeadActivitySchema } from '@/lib/validations/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: leadId } = await params
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } })
    if (!lead) return apiNotFound('Lead')

    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(activities)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: leadId } = await params
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } })
    if (!lead) return apiNotFound('Lead')

    const body = await req.json()
    const data = createLeadActivitySchema.parse({ ...body, leadId })

    const activity = await prisma.leadActivity.create({
      data: {
        tenantId,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })

    return apiSuccess(activity, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
