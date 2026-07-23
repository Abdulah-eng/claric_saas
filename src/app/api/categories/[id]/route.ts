import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateCategorySchema } from '@/lib/validations/catalog'
import { getCategoryById } from '@/lib/queries/catalog'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getCategoryById(tenantId, id)
    if (!existing) return apiNotFound('Category')

    const body = await req.json()
    const data = updateCategorySchema.parse(body)

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    return apiSuccess(category)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getCategoryById(tenantId, id)
    if (!existing) return apiNotFound('Category')

    await prisma.category.update({ where: { id }, data: { isActive: false } })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
