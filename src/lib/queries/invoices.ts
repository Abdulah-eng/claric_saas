import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function listInvoices(
  tenantId: string,
  opts: { q?: string; status?: string; customerId?: string; page?: number; perPage?: number } = {}
) {
  const { q = '', status, customerId, page = 1, perPage = 20 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.InvoiceWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(customerId && { customerId }),
    ...(q && {
      OR: [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, companyName: true, email: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ])

  return { invoices, total }
}

export async function getInvoiceById(tenantId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: { select: { id: true, companyName: true, email: true, phone: true, billingAddress: true, billingCity: true, billingState: true, billingPostal: true, billingCountry: true } },
      order: { select: { id: true, orderNumber: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } }
    },
  })
}
