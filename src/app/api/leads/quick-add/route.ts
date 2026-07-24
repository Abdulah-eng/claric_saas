import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const { companyName, firstName, lastName, email, phone, source, followUpOn, notes } = body

    if (!firstName) {
      return new Response(JSON.stringify({ success: false, error: 'First Name is required' }), { status: 400 })
    }
    if (!source) {
      return new Response(JSON.stringify({ success: false, error: 'Source is required' }), { status: 400 })
    }

    const type = companyName ? 'BUSINESS' : 'INDIVIDUAL'
    const finalCompanyName = companyName || `${firstName} ${lastName || ''}`.trim()

    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const cust = await tx.customer.create({
        data: {
          tenantId,
          type,
          companyName: finalCompanyName,
          email,
          phone,
          notes,
        }
      })

      // 2. Create Primary Contact
      await tx.contact.create({
        data: {
          tenantId,
          customerId: cust.id,
          firstName,
          lastName: lastName || '',
          email,
          phone,
          isPrimary: true,
        }
      })

      // 3. Create FollowUp if date provided
      if (followUpOn) {
        await tx.followUp.create({
          data: {
            tenantId,
            customerId: cust.id,
            title: `${source} Follow-up`,
            notes: notes || 'Quick Add Lead first activity',
            dueDate: new Date(followUpOn),
            assignedToId: user.id,
          }
        })
      }

      // 4. Create Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          customerId: cust.id,
          action: 'CREATE',
          entity: 'Customer',
          entityId: cust.id,
          newValues: cust as any,
        }
      })

      return cust
    })

    return apiSuccess(customer)
  } catch (e) {
    return apiServerError(e)
  }
}
