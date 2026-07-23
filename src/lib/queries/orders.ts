import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function listOrders(
  tenantId: string,
  opts: { q?: string; status?: string; customerId?: string; page?: number; perPage?: number } = {}
) {
  const { q = '', status, customerId, page = 1, perPage = 20 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.OrderWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(customerId && { customerId }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, companyName: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total }
}

export async function getOrderById(tenantId: string, id: string) {
  return prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      customer: { select: { id: true, companyName: true, email: true, phone: true, billingAddress: true, billingCity: true, billingCountry: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'asc' }
      },
      quote: { select: { id: true, quoteNumber: true } }
    },
  })
}
