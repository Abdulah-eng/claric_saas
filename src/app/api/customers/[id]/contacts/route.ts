import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { createContactSchema } from '@/lib/validations/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/customers/[id]/contacts
export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params

    const contacts = await prisma.contact.findMany({
      where: { customerId, tenantId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    })

    return apiSuccess(contacts)
  } catch (e) {
    return apiServerError(e)
  }
}

// POST /api/customers/[id]/contacts
export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params

    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } })
    if (!customer) return apiNotFound('Customer')

    const body = await req.json()
    const data = createContactSchema.parse({ ...body, customerId })

    // If this is primary, unset others
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId, tenantId },
        data: { isPrimary: false },
      })
    }

    const contact = await prisma.contact.create({
      data: { ...data, tenantId },
    })

    return apiSuccess(contact, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
