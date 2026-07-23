import { z } from 'zod'

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['STRIPE', 'SQUARE', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})
