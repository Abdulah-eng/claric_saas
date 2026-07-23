import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination } from '@/lib/api-response'
import { createSampleSchema, updateSampleSchema } from '@/lib/validations/crm'
import { listSamples } from '@/lib/queries/crm'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { page, perPage } = parsePagination(req.url)
    const status = new URL(req.url).searchParams.get('status') ?? undefined

    const { samples, total } = await listSamples(tenantId, { status, page, perPage })
    return apiSuccess(samples, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createSampleSchema.parse(body)

    const { items, ...restData } = data

    const sample = await prisma.sample.create({
      data: {
        tenantId,
        ...restData,
        followUpDate: restData.followUpDate ? new Date(restData.followUpDate) : undefined,
        items: items.length > 0 ? {
          create: items.map(item => ({
            name: item.name,
            productId: item.productId,
            customizationType: item.customizationType,
            notes: item.notes,
            quantity: item.quantity,
            unitValue: item.unitValue,
          }))
        } : undefined
      },
      include: {
        lead: { select: { id: true, companyName: true } },
        customer: { select: { id: true, companyName: true } },
        product: { select: { id: true, name: true, sku: true } },
        items: true,
      },
    })

    return apiSuccess(sample, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
