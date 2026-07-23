import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function listProductionJobs(
  tenantId: string,
  opts: { q?: string; stage?: string; status?: string; page?: number; perPage?: number } = {}
) {
  const { q = '', stage, status, page = 1, perPage = 50 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.ProductionJobWhereInput = {
    tenantId,
    ...(stage && { stage }),
    ...(status && { status: status as any }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { customer: { companyName: { contains: q, mode: 'insensitive' } } } },
      ],
    }),
  }

  const [jobs, total] = await Promise.all([
    prisma.productionJob.findMany({
      where,
      skip,
      take: perPage,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { companyName: true } }
          }
        },
        _count: { select: { tasks: true, artworkVersions: true, qualityChecks: true } }
      },
    }),
    prisma.productionJob.count({ where }),
  ])

  return { jobs, total }
}

export async function getProductionJobById(tenantId: string, id: string) {
  return prisma.productionJob.findFirst({
    where: { id, tenantId },
    include: {
      order: {
        include: {
          customer: { select: { companyName: true, email: true, phone: true } },
          items: {
            include: { product: { select: { name: true } } }
          }
        }
      },
      tasks: { orderBy: { sortOrder: 'asc' } },
      artworkVersions: { orderBy: { version: 'desc' } },
      qualityChecks: { orderBy: { sortOrder: 'asc' } }
    },
  })
}
