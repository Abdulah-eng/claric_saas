import { z } from 'zod'

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  orderId: z.string().optional(),
  type: z.enum(['DEPOSIT', 'MILESTONE', 'FINAL', 'CREDIT_NOTE']).default('FINAL'),
  dueDate: z.string().datetime().optional(),
  
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  notes: z.string().optional(),
})

export const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'CREDIT_NOTE']).optional(),
  dueDate: z.string().datetime().optional(),
})
