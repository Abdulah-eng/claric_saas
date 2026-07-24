import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateQuoteSchema } from '@/lib/validations/quoting'
import { getQuoteById } from '@/lib/queries/quoting'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const quote = await getQuoteById(tenantId, id)
    if (!quote) return apiNotFound('Quote')
    return apiSuccess(quote)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getQuoteById(tenantId, id)
    if (!existing) return apiNotFound('Quote')

    const body = await req.json()
    const data = updateQuoteSchema.parse(body)

    let subtotal = Number(existing.subtotal)
    let taxAmount = Number(existing.taxAmount)
    let discountAmount = Number(existing.discountAmount)
    let total = Number(existing.total)

    const updateData: any = {
      title: data.title,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      status: data.status,
      discountAmount: data.discountAmount,
      discountPercent: data.discountPercent,
      notes: data.notes,
      terms: data.terms,
    }

    if (data.items) {
      subtotal = 0
      taxAmount = 0
      data.items.forEach((li) => {
        const lineTotal = li.unitPrice * li.quantity
        subtotal += lineTotal
        taxAmount += lineTotal * (li.taxRate / 100)
      })

      if (data.discountAmount !== undefined) {
         discountAmount = data.discountAmount
      }

      total = subtotal - discountAmount + taxAmount

      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.discountAmount = discountAmount
      updateData.total = total
    }

    const quote = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.quoteItem.deleteMany({ where: { quoteId: id } })
      }
      if (data.paymentMilestones) {
        await tx.paymentMilestone.deleteMany({ where: { quoteId: id } })
      }

      return tx.quote.update({
        where: { id },
        data: {
          ...updateData,
          ...(data.items && {
            items: {
              create: data.items.map((li) => ({
                productId: li.productId,
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                taxRate: li.taxRate,
                total: li.unitPrice * li.quantity,
              })),
            },
          }),
          ...(data.paymentMilestones && {
            paymentMilestones: {
              create: data.paymentMilestones.map((m) => ({
                name: m.name,
                percent: m.percent,
                amount: m.amount,
              })),
            },
          }),
        },
        include: { 
          customer: { select: { companyName: true } },
          items: true,
          paymentMilestones: true,
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: quote.customerId,
        action: 'UPDATE',
        entity: 'Quote',
        entityId: id,
        newValues: { status: quote.status, total: quote.total } as any,
      },
    })

    return apiSuccess(quote)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getQuoteById(tenantId, id)
    if (!existing) return apiNotFound('Quote')

    await prisma.quote.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId, userId: user.id, action: 'DELETE', entity: 'Quote', entityId: id },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
