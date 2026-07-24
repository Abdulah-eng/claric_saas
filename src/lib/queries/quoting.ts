import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>['quotes'][0]
export type QuoteDetail = NonNullable<Awaited<ReturnType<typeof getQuoteById>>>

export async function listQuotes(
  tenantId: string,
  opts: { q?: string; status?: string; customerId?: string; page?: number; perPage?: number } = {}
) {
  const { q = '', status, customerId, page = 1, perPage = 20 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.QuoteWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(customerId && { customerId }),
    ...(q && {
      OR: [
        { quoteNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, companyName: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.quote.count({ where }),
  ])

  return { quotes, total }
}

export async function getQuoteById(tenantId: string, id: string) {
  return prisma.quote.findFirst({
    where: { id, tenantId },
    include: {
      customer: { select: { id: true, companyName: true, email: true, phone: true, billingAddress: true, billingCity: true, billingState: true, billingPostal: true, billingCountry: true, contacts: { select: { firstName: true, lastName: true, isPrimary: true } } } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'asc' }
      },
      order: { select: { id: true, orderNumber: true, status: true, total: true } },
      paymentMilestones: { orderBy: { id: 'asc' } }
    },
  })
}
