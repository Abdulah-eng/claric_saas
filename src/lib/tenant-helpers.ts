import { prisma } from '@/lib/db'

/**
 * Generates the next sequential number for quotes, orders, invoices.
 * Uses a database transaction to ensure no duplicates.
 */
export async function generateDocumentNumber(
  tenantId: string,
  type: 'quote' | 'order' | 'invoice'
): Promise<string> {
  const fieldMap = {
    quote: { prefix: 'quotePrefix', counter: 'nextQuoteNumber' },
    order: { prefix: 'orderPrefix', counter: 'nextOrderNumber' },
    invoice: { prefix: 'invoicePrefix', counter: 'nextInvoiceNumber' },
  }

  const { prefix: prefixField, counter: counterField } = fieldMap[type]

  const result = await prisma.$transaction(async (tx) => {
    const settings = await tx.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        [prefixField]: true,
        [counterField]: true,
      },
    })

    if (!settings) throw new Error('Tenant settings not found')

    const prefix = (settings as any)[prefixField] as string
    const counter = (settings as any)[counterField] as number
    const paddedNumber = String(counter).padStart(5, '0')

    await tx.tenantSettings.update({
      where: { tenantId },
      data: { [counterField]: counter + 1 },
    })

    return `${prefix}-${paddedNumber}`
  })

  return result
}

/**
 * Ensures tenant settings exist, creating defaults if not.
 */
export async function ensureTenantSettings(tenantId: string) {
  const existing = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  if (existing) return existing

  return prisma.tenantSettings.create({
    data: { tenantId },
  })
}

/**
 * Fetch tenant with white label config for branding.
 */
export async function getTenantBranding(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      whiteLabelConfig: true,
      company: {
        select: {
          name: true,
          logoUrl: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          currency: true,
          timezone: true,
        },
      },
    },
  })
}
