import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateProductSchema } from '@/lib/validations/catalog'
import { getProductById } from '@/lib/queries/catalog'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const product = await getProductById(tenantId, id)
    if (!product) return apiNotFound('Product')
    return apiSuccess(product)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getProductById(tenantId, id)
    if (!existing) return apiNotFound('Product')

    const body = await req.json()
    const data = updateProductSchema.parse(body)

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'Product',
        entityId: id,
        oldValues: existing as any,
        newValues: product as any,
      },
    })

    return apiSuccess(product)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getProductById(tenantId, id)
    if (!existing) return apiNotFound('Product')

    await prisma.product.update({ where: { id }, data: { isActive: false } })

    await prisma.auditLog.create({
      data: { tenantId, userId: user.id, action: 'DELETE', entity: 'Product', entityId: id },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
