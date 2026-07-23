import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateInvoiceSchema } from '@/lib/validations/invoices'
import { getInvoiceById } from '@/lib/queries/invoices'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const invoice = await getInvoiceById(tenantId, id)
    if (!invoice) return apiNotFound('Invoice')
    return apiSuccess(invoice)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getInvoiceById(tenantId, id)
    if (!existing) return apiNotFound('Invoice')

    const body = await req.json()
    const data = updateInvoiceSchema.parse(body)

    const updateData: any = {}
    if (data.status) updateData.status = data.status
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)

    if (data.status === 'SENT' && existing.status === 'DRAFT') {
      updateData.sentAt = new Date()
    }
    if (data.status === 'PAID') {
      updateData.paidAt = new Date()
      updateData.amountDue = 0
      updateData.amountPaid = existing.total
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: existing.customerId,
        action: 'UPDATE',
        entity: 'Invoice',
        entityId: id,
        newValues: updateData,
      },
    })

    return apiSuccess(invoice)
  } catch (e) {
    return apiServerError(e)
  }
}
