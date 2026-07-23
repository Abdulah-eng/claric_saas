import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { tenantId } = await requireTenant()

    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      productionJobs,
      recentInvoices,
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId, status: { not: 'CANCELLED' } } }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { total: true },
      }),
      prisma.productionJob.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true }
      }),
      prisma.invoice.findMany({
        where: { tenantId, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { createdAt: true, total: true }
      })
    ])

    // Format revenue over time for charts
    const revenueByDay: Record<string, number> = {}
    recentInvoices.forEach(inv => {
      const date = inv.createdAt.toISOString().split('T')[0]
      revenueByDay[date] = (revenueByDay[date] || 0) + Number(inv.total)
    })

    const chartData = Object.keys(revenueByDay).sort().map(date => ({
      date,
      revenue: revenueByDay[date]
    }))

    return apiSuccess({
      kpis: {
        totalCustomers,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
      },
      productionStats: productionJobs.map(job => ({
        status: job.status,
        count: job._count.id
      })),
      revenueChart: chartData,
    })
  } catch (e) {
    return apiServerError(e)
  }
}
