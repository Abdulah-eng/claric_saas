import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, parseSearchParams } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q } = parseSearchParams(req.url)

    if (!q || q.length < 2) {
      return apiSuccess({ customers: [], quotes: [], orders: [], invoices: [] })
    }

    const searchStr = q

    const [customers, quotes, orders, invoices] = await Promise.all([
      prisma.customer.findMany({
        where: {
          tenantId,
          OR: [
            { companyName: { contains: searchStr, mode: 'insensitive' } },
            { email: { contains: searchStr, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, companyName: true, email: true }
      }),
      prisma.quote.findMany({
        where: {
          tenantId,
          OR: [
            { quoteNumber: { contains: searchStr, mode: 'insensitive' } },
            { title: { contains: searchStr, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, quoteNumber: true, title: true, status: true }
      }),
      prisma.order.findMany({
        where: {
          tenantId,
          orderNumber: { contains: searchStr, mode: 'insensitive' }
        },
        take: 5,
        select: { id: true, orderNumber: true, status: true }
      }),
      prisma.invoice.findMany({
        where: {
          tenantId,
          invoiceNumber: { contains: searchStr, mode: 'insensitive' }
        },
        take: 5,
        select: { id: true, invoiceNumber: true, status: true }
      })
    ])

    return apiSuccess({ customers, quotes, orders, invoices })
  } catch (e) {
    return apiServerError(e)
  }
}
