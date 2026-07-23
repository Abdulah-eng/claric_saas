import { z } from 'zod'

export const createOrderFromQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
})

export const updateOrderSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'IN_PRODUCTION',
    'QUALITY_CHECK',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ]).optional(),
  notes: z.string().optional(),
})
