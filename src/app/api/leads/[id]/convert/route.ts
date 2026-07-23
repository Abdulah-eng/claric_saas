import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound, apiError } from '@/lib/api-response'
import { convertLeadSchema, createLeadActivitySchema } from '@/lib/validations/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// POST /api/leads/[id]/convert  — convert lead to customer
export async function POST(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params

    const lead = await prisma.lead.findFirst({ where: { id, tenantId } })
    if (!lead) return apiNotFound('Lead')
    if (lead.customerId) return apiError('Lead already converted', 409)

    const body = await req.json()
    const data = convertLeadSchema.parse({ ...body, leadId: id })

    // Create customer from lead, preserving all history
    const customer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          tenantId,
          companyName: data.companyName ?? lead.companyName,
          email: data.email ?? lead.email ?? undefined,
          phone: data.phone ?? lead.phone ?? undefined,
          billingAddress: data.billingAddress,
          billingCity: data.billingCity,
          billingState: data.billingState,
          billingCountry: data.billingCountry,
          billingPostal: data.billingPostal,
          tags: lead.tags,
          notes: lead.notes ?? undefined,
        },
      })

      // Link lead to new customer and mark as WON
      await tx.lead.update({
        where: { id },
        data: {
          customerId: cust.id,
          status: 'WON',
          convertedAt: new Date(),
        },
      })

      // Log conversion
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          customerId: cust.id,
          action: 'CONVERT_LEAD',
          entity: 'Lead',
          entityId: id,
          newValues: { customerId: cust.id } as any,
        },
      })

      return cust
    })

    return apiSuccess({ customer, message: 'Lead successfully converted to customer' })
  } catch (e) {
    return apiServerError(e)
  }
}
