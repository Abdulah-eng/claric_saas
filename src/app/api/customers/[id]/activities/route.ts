import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound, apiError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createActivitySchema = z.object({
  source: z.string().min(1, 'Source is required'),
  subject: z.string().min(1, 'Subject is required'),
  occurredAt: z.string().or(z.date()).transform((val) => new Date(val)),
  contactId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params

    const activities = await prisma.customerActivity.findMany({
      where: { customerId, tenantId },
      orderBy: { occurredAt: 'desc' },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return apiSuccess(activities)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params

    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } })
    if (!customer) return apiNotFound('Customer')

    const body = await req.json()
    const validated = createActivitySchema.safeParse(body)
    if (!validated.success) {
      return apiError(validated.error.issues[0].message)
    }

    const data = validated.data
    const activity = await prisma.customerActivity.create({
      data: {
        tenantId,
        customerId,
        source: data.source,
        subject: data.subject,
        occurredAt: data.occurredAt,
        contactId: data.contactId || null,
        notes: data.notes || '',
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return apiSuccess(activity, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
