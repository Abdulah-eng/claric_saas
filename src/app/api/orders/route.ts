import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createOrderFromQuoteSchema } from '@/lib/validations/orders'
import { listOrders } from '@/lib/queries/orders'
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

    const { orders, total } = await listOrders(tenantId, { q, status, customerId, page, perPage })
    return apiSuccess(orders, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createOrderFromQuoteSchema.parse(body)

    const quote = await prisma.quote.findFirst({
      where: { id: data.quoteId, tenantId },
      include: { items: true },
    })

    if (!quote) return apiServerError(new Error('Quote not found'))

    const orderNumber = await generateDocumentNumber(tenantId, 'order')

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          quoteId: quote.id,
          customerId: quote.customerId,
          status: 'CONFIRMED',
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          total: quote.total,
          currency: quote.currency,
          depositAmount: quote.depositAmount,
          notes: quote.notes,
          items: {
            create: quote.items.map((li) => ({
              quoteItemId: li.id,
              productId: li.productId,
              variantId: li.variantId,
              serviceId: li.serviceId,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              discountPercent: li.discountPercent,
              discountAmount: li.discountAmount,
              taxRuleId: li.taxRuleId,
              taxRate: li.taxRate,
              taxAmount: li.taxAmount,
              total: li.total,
              isOptional: li.isOptional,
              sortOrder: li.sortOrder,
              notes: li.notes,
            })),
          },
        },
        include: {
          customer: { select: { companyName: true } },
        },
      })

      // Auto-create Production Job
      await tx.productionJob.create({
        data: {
          tenantId,
          orderId: newOrder.id,
          title: `Production: ${newOrder.orderNumber}`,
          description: `Auto-generated production job for order ${newOrder.orderNumber}.`,
          stage: 'PRE_PRESS',
          status: 'PENDING',
        }
      })

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'CONVERTED' },
      })

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          customerId: quote.customerId,
          action: 'CREATE',
          entity: 'Order',
          entityId: newOrder.id,
          newValues: { orderNumber: newOrder.orderNumber, quoteId: quote.id } as any,
        },
      })

      return newOrder
    })

    return apiSuccess(order, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
