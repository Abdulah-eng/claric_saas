import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError, apiForbidden } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const storeSchema = z.object({
  name: z.string().min(2, 'Store name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  themeColor: z.string().optional(),
})

export async function GET() {
  try {
    const { tenantId } = await requireTenant()
    const stores = await prisma.companyStore.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(stores)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    if (user.role !== 'COMPANY_ADMIN' && !user.isSuperAdmin) return apiForbidden()

    const body = await req.json()
    const validated = storeSchema.safeParse(body)
    if (!validated.success) return apiError(validated.error.issues[0].message)

    const existing = await prisma.companyStore.findFirst({
      where: { tenantId, slug: validated.data.slug }
    })
    if (existing) return apiError('A store with this slug already exists')

    const store = await prisma.companyStore.create({
      data: { tenantId, ...validated.data }
    })
    return apiSuccess(store, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
