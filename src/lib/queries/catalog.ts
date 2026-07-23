import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ============================================================
// Category queries
// ============================================================

export async function listCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  })
}

export async function getCategoryById(tenantId: string, id: string) {
  return prisma.category.findFirst({
    where: { id, tenantId, isActive: true },
  })
}

// ============================================================
// Product queries
// ============================================================

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>['products'][0]
export type ProductDetail = Awaited<ReturnType<typeof getProductById>>

export async function listProducts(
  tenantId: string,
  opts: { q?: string; categoryId?: string; page?: number; perPage?: number; tag?: string } = {}
) {
  const { q = '', categoryId, page = 1, perPage = 20, tag } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.ProductWhereInput = {
    tenantId,
    isActive: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(tag && { tags: { has: tag } }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { tierPrices: true, variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  return { products, total }
}

export async function getProductById(tenantId: string, id: string) {
  return prisma.product.findFirst({
    where: { id, tenantId, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      tierPrices: { orderBy: { minQty: 'asc' } },
      variants: { orderBy: { name: 'asc' } },
    },
  })
}
