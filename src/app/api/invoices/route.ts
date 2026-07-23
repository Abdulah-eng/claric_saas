import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createInvoiceSchema } from '@/lib/validations/invoices'
import { listInvoices } from '@/lib/queries/invoices'
import { generateDocumentNumber } from '@/lib/tenant-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const sp = new URL(req.url).searchParams
    const status = sp.get('status') ?? undefined
    const customerId = sp.get('customerId') ?? undefined

    const { invoices, total } = await listInvoices(tenantId, { q, status, customerId, page, perPage })
    return apiSuccess(invoices, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()

    // If orderId is provided, we can auto-generate the invoice items from the order
    let invoiceItems = body.items || []
    
    if (body.orderId && invoiceItems.length === 0) {
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: { items: true }
      })
      if (!order) return apiServerError(new Error('Order not found'))
      
      invoiceItems = order.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxAmount: Number(item.taxAmount),
        total: Number(item.total),
      }))

      if (!body.subtotal) body.subtotal = Number(order.subtotal)
      if (!body.taxAmount) body.taxAmount = Number(order.taxAmount)
      if (!body.discountAmount) body.discountAmount = Number(order.discountAmount)
      if (!body.total) body.total = Number(order.total)
      if (!body.customerId) body.customerId = order.customerId
    }

    const data = createInvoiceSchema.parse(body)
    const invoiceNumber = await generateDocumentNumber(tenantId, 'invoice')

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customerId: data.customerId,
          orderId: data.orderId,
          type: data.type,
          status: 'DRAFT',
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          taxAmount: data.taxAmount,
          total: data.total,
          amountDue: data.total,
          notes: data.notes,
          items: {
            create: invoiceItems.map((li: any) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxAmount: li.taxAmount || 0,
              total: li.total,
            }))
          }
        },
        include: {
          customer: { select: { companyName: true } }
        }
      })

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          customerId: data.customerId,
          action: 'CREATE',
          entity: 'Invoice',
          entityId: inv.id,
          newValues: { invoiceNumber, total: data.total } as any,
        },
      })

      return inv
    })

    return apiSuccess(invoice, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
