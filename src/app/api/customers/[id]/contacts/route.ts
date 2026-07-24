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

// PUT /api/customers/[id]/contacts
export async function PUT(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params
    const body = await req.json()
    const { contactId, isPrimary, ...updateData } = body

    const existing = await prisma.contact.findFirst({ where: { id: contactId, customerId, tenantId } })
    if (!existing) return apiNotFound('Contact')

    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId, tenantId },
        data: { isPrimary: false },
      })
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...updateData,
        ...(isPrimary !== undefined && { isPrimary }),
      },
    })

    return apiSuccess(updated)
  } catch (e) {
    return apiServerError(e)
  }
}

// DELETE /api/customers/[id]/contacts
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params
    const body = await req.json()
    const { contactId } = body

    const existing = await prisma.contact.findFirst({ where: { id: contactId, customerId, tenantId } })
    if (!existing) return apiNotFound('Contact')

    await prisma.contact.delete({ where: { id: contactId } })

    // If we just deleted the primary contact, promote the next one to primary
    if (existing.isPrimary) {
      const nextContact = await prisma.contact.findFirst({
        where: { customerId, tenantId },
        orderBy: { createdAt: 'asc' },
      })
      if (nextContact) {
        await prisma.contact.update({
          where: { id: nextContact.id },
          data: { isPrimary: true }
        })
      }
    }

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
