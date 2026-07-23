import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createProductSchema } from '@/lib/validations/catalog'
import { listProducts } from '@/lib/queries/catalog'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q, ...rest } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const sp = new URL(req.url).searchParams
    const categoryId = sp.get('categoryId') ?? undefined
    const tag = sp.get('tag') ?? undefined

    const { products, total } = await listProducts(tenantId, { q, categoryId, page, perPage, tag })
    return apiSuccess(products, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createProductSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        tenantId,
        ...data,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        newValues: product as any,
      },
    })

    return apiSuccess(product, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
