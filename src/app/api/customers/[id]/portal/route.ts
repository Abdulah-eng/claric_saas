import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound, apiError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// POST /api/customers/[id]/portal
// Send invite / enable access for a contact
export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params
    const body = await req.json()
    const { contactId } = body

    if (!contactId) {
      return apiError('Contact ID is required')
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, customerId, tenantId },
    })

    if (!contact) {
      return apiNotFound('Contact')
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        hasPortalAccess: true,
        portalInviteSentAt: new Date(),
      },
    })

    // Also log this portal invitation in the CustomerActivity timeline
    await prisma.customerActivity.create({
      data: {
        tenantId,
        customerId,
        contactId,
        source: 'Email',
        subject: 'Portal invitation sent',
        notes: `Portal invitation sent to ${contact.firstName} ${contact.lastName} (${contact.email || 'no email'})`,
        occurredAt: new Date(),
      }
    })

    return apiSuccess(updatedContact)
  } catch (e) {
    return apiServerError(e)
  }
}

// DELETE /api/customers/[id]/portal
// Revoke portal access
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: customerId } = await params
    const body = await req.json()
    const { contactId } = body

    if (!contactId) {
      return apiError('Contact ID is required')
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, customerId, tenantId },
    })

    if (!contact) {
      return apiNotFound('Contact')
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        hasPortalAccess: false,
        portalInviteSentAt: null,
      },
    })

    // Also log revocation in the CustomerActivity timeline
    await prisma.customerActivity.create({
      data: {
        tenantId,
        customerId,
        contactId,
        source: 'Note',
        subject: 'Portal access revoked',
        notes: `Portal access revoked for ${contact.firstName} ${contact.lastName}`,
        occurredAt: new Date(),
      }
    })

    return apiSuccess(updatedContact)
  } catch (e) {
    return apiServerError(e)
  }
}
