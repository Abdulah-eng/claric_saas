import { prisma } from '@/lib/db'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'

type Params = { params: Promise<{ customerId: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    const { customerId } = await params
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        quotes: { orderBy: { createdAt: 'desc' }, take: 5 },
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
      }
    })

    if (!customer) return apiNotFound('Customer')

    return apiSuccess(customer)
  } catch (e) {
    return apiServerError(e)
  }
}
