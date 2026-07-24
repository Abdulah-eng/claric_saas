import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parsePagination, parseSearchParams } from '@/lib/api-response'
import { createQuoteSchema } from '@/lib/validations/quoting'
import { listQuotes } from '@/lib/queries/quoting'
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

    const { quotes, total } = await listQuotes(tenantId, { q, status, customerId, page, perPage })
    return apiSuccess(quotes, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const data = createQuoteSchema.parse(body)

    const quoteNumber = await generateDocumentNumber(tenantId, 'quote')

    let subtotal = 0
    data.items.forEach((li) => {
      subtotal += li.unitPrice * li.quantity
    })

    let discountAmount = 0
    if (data.discountAmount !== undefined && data.discountPercent !== undefined) {
       discountAmount = data.discountAmount // from payload
    }

    const preTaxTotal = subtotal - discountAmount

    let totalTax = 0
    data.items.forEach((li) => {
      // Simplistic tax calculation
      const lineTotal = li.unitPrice * li.quantity
      totalTax += lineTotal * (li.taxRate / 100)
    })

    const total = preTaxTotal + totalTax

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        quoteNumber,
        customerId: data.customerId,
        createdById: user.id,
        title: data.title,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        status: 'DRAFT',
        subtotal,
        discountAmount,
        discountPercent: data.discountPercent,
        taxAmount: totalTax,
        total,
        notes: data.notes,
        terms: data.terms,
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
        paymentMilestones: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: data.customerId,
        action: 'CREATE',
        entity: 'Quote',
        entityId: quote.id,
        newValues: { quoteNumber, total } as any,
      },
    })

    return apiSuccess(quote, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
