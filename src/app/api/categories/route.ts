import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError } from '@/lib/api-response'
import { createCategorySchema } from '@/lib/validations/catalog'
import { listCategories } from '@/lib/queries/catalog'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const categories = await listCategories(tenantId)
    return apiSuccess(categories)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const body = await req.json()
    const data = createCategorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        tenantId,
        ...data,
      },
    })

    return apiSuccess(category, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
