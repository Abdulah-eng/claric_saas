import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError } from '@/lib/api-response'
import { createPaymentSchema } from '@/lib/validations/payments'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { searchParams } = new URL(req.url)
    const method = searchParams.get('method')
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const perPage = 20

    const where: any = { tenantId }
    if (method) where.method = method
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
          customer: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.payment.count({ where }),
    ])

    // Summary stats
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const [collected, refunded] = await Promise.all([
      prisma.payment.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] }, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ])

    return apiSuccess({
      payments,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
      stats: {
        collectedThisMonth: collected._sum.amount || 0,
        refundedThisMonth: refunded._sum.amount || 0,
      },
    })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createPaymentSchema.parse(body)

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    })

    if (!invoice) return apiServerError(new Error('Invoice not found'))

    const payment = await prisma.$transaction(async (tx) => {
      const pmt = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          orderId: invoice.orderId,
          customerId: invoice.customerId,
          method: data.method,
          status: 'COMPLETED',
          amount: data.amount,
          currency: invoice.currency,
          reference: data.referenceNumber,
          notes: data.notes,
        },
      })

      const newAmountPaid = Number(invoice.amountPaid) + data.amount
      const newAmountDue = Math.max(Number(invoice.total) - newAmountPaid, 0)
      let newStatus = invoice.status

      if (newAmountDue === 0) {
        newStatus = 'PAID'
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIALLY_PAID'
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : invoice.paidAt,
        },
      })

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          customerId: invoice.customerId,
          action: 'CREATE',
          entity: 'Payment',
          entityId: pmt.id,
          newValues: { amount: data.amount, method: data.method } as any,
        },
      })

      return pmt
    })

    return apiSuccess(payment, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
