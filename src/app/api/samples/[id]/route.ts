import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateSampleSchema } from '@/lib/validations/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const sample = await prisma.sample.findFirst({
      where: { id, tenantId },
      include: {
        lead: { select: { id: true, companyName: true } },
        customer: { select: { id: true, companyName: true } },
        product: { select: { id: true, name: true, sku: true } },
        items: true,
      },
    })
    if (!sample) return apiNotFound('Sample')
    return apiSuccess(sample)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const existing = await prisma.sample.findFirst({ where: { id, tenantId } })
    if (!existing) return apiNotFound('Sample')

    const body = await req.json()
    const data = updateSampleSchema.parse(body)

    const { items, ...restData } = data

    // Handle nested update for items
    let itemsUpdate = undefined
    if (items !== undefined) {
      itemsUpdate = {
        deleteMany: {},
        create: items.map((item: any) => ({
          name: item.name,
          productId: item.productId,
          customizationType: item.customizationType,
          notes: item.notes,
          quantity: item.quantity,
          unitValue: item.unitValue,
        }))
      }
    }

    const sample = await prisma.sample.update({
      where: { id },
      data: {
        ...restData,
        followUpDate: restData.followUpDate ? new Date(restData.followUpDate) : undefined,
        shippedAt: restData.shippedAt ? new Date(restData.shippedAt) : undefined,
        deliveredAt: restData.deliveredAt ? new Date(restData.deliveredAt) : undefined,
        items: itemsUpdate,
      },
      include: {
        lead: { select: { id: true, companyName: true } },
        customer: { select: { id: true, companyName: true } },
        product: { select: { id: true, name: true, sku: true } },
        items: true,
      },
    })

    return apiSuccess(sample)
  } catch (e) {
    console.error("PUT Sample Error:", e)
    return apiServerError(e)
  }
}
