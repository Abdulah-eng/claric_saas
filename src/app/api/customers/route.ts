import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createCustomerSchema } from '@/lib/validations/crm'
import { listCustomers } from '@/lib/queries/crm'
import { prisma } from '@/lib/db'
import { generateId } from '@/lib/utils'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q, ...rest } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const tag = new URL(req.url).searchParams.get('tag') ?? undefined

    const { customers, total } = await listCustomers(tenantId, { q, page, perPage, tag })

    return apiSuccess(customers, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createCustomerSchema.parse(body)

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        ...data,
        tags: data.tags ?? [],
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'CREATE',
        entity: 'Customer',
        entityId: customer.id,
        newValues: customer as any,
      },
    })

    return apiSuccess(customer, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
