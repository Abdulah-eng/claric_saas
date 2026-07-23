import { z } from 'zod'

export const quoteLineItemSchema = z.object({
  id: z.string().optional(), // optional for new items
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
})

export const createQuoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  title: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(quoteLineItemSchema).min(1, 'At least one line item is required'),
})

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
})

export const generateQuotePdfSchema = z.object({
  quoteId: z.string().min(1),
})
