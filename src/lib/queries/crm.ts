import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ============================================================
// Customer queries
// ============================================================

export type CustomerListItem = Awaited<ReturnType<typeof listCustomers>>['customers'][0]
export type CustomerDetail = Awaited<ReturnType<typeof getCustomerById>>

export async function listCustomers(
  tenantId: string,
  opts: { q?: string; page?: number; perPage?: number; tag?: string } = {}
) {
  const { q = '', page = 1, perPage = 20, tag } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    isActive: true,
    ...(q && {
      OR: [
        { companyName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    }),
    ...(tag && { tags: { has: tag } }),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        billingCity: true,
        billingCountry: true,
        tags: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            quotes: true,
            orders: true,
            contacts: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ])

  return { customers, total }
}

export async function getCustomerById(tenantId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, tenantId, isActive: true },
    include: {
      contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
      leads: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, companyName: true, status: true, estimatedValue: true, createdAt: true },
      },
      quotes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, quoteNumber: true, status: true, total: true, createdAt: true },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, invoiceNumber: true, status: true, total: true, amountDue: true, createdAt: true },
      },
      followUps: {
        where: { isDone: false },
        orderBy: { dueDate: 'asc' },
      },
      _count: {
        select: {
          quotes: true,
          orders: true,
          invoices: true,
          payments: true,
          messages: true,
        },
      },
    },
  })
}

// ============================================================
// Lead queries
// ============================================================

export type LeadListItem = Awaited<ReturnType<typeof listLeads>>['leads'][0]
export type LeadDetail = Awaited<ReturnType<typeof getLeadById>>

export async function listLeads(
  tenantId: string,
  opts: { q?: string; status?: string; assignedToId?: string; page?: number; perPage?: number } = {}
) {
  const { q = '', status, assignedToId, page = 1, perPage = 50 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.LeadWhereInput = {
    tenantId,
    ...(q && {
      OR: [
        { companyName: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status: status as any }),
    ...(assignedToId && { assignedToId }),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, name: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: { select: { activities: true } },
      },
    }),
    prisma.lead.count({ where }),
  ])

  return { leads, total }
}

export async function getLeadById(tenantId: string, id: string) {
  return prisma.lead.findFirst({
    where: { id, tenantId },
    include: {
      assignedTo: {
        select: { id: true, name: true, firstName: true, lastName: true, avatarUrl: true },
      },
      activities: { orderBy: { createdAt: 'desc' } },
      followUps: { orderBy: { dueDate: 'asc' } },
      customer: { select: { id: true, companyName: true } },
    },
  })
}

// ============================================================
// Sample queries
// ============================================================

export async function listSamples(
  tenantId: string,
  opts: { status?: string; page?: number; perPage?: number } = {}
) {
  const { status, page = 1, perPage = 20 } = opts
  const skip = (page - 1) * perPage

  const where: Prisma.SampleWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
  }

  const [samples, total] = await Promise.all([
    prisma.sample.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        lead: { select: { id: true, companyName: true } },
        customer: { select: { id: true, companyName: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    }),
    prisma.sample.count({ where }),
  ])

  return { samples, total }
}
