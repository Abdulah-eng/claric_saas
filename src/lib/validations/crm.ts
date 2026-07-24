import { z } from 'zod'

// ============================================================
// Customer schemas
// ============================================================

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  legalName: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  // Billing
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().default('US'),
  billingPostal: z.string().optional(),
  // Shipping
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPostal: z.string().optional(),
  // Meta
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const createContactSchema = z.object({
  customerId: z.string().min(1),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
})

export const updateContactSchema = createContactSchema.omit({ customerId: true }).partial()

// ============================================================
// Lead schemas
// ============================================================

export const createLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  source: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).default('NEW'),
  estimatedValue: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export const updateLeadSchema = createLeadSchema.partial()

export const createLeadActivitySchema = z.object({
  leadId: z.string().min(1),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'OTHER']),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  isDone: z.boolean().default(false),
})

export const convertLeadSchema = z.object({
  leadId: z.string().min(1),
  companyName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().default('US'),
  billingPostal: z.string().optional(),
})

// ============================================================
// Sample schemas
// ============================================================

export const sampleItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  productId: z.string().optional().nullable(),
  customizationType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  unitValue: z.coerce.number().min(0).default(0),
})

export const createSampleSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quoteId: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  deliveredAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).default([]),
  totalValue: z.coerce.number().min(0).default(0),
  items: z.array(sampleItemSchema).default([]),
})

export const updateSampleSchema = createSampleSchema.extend({
  status: z.enum(['REQUESTED', 'SHIPPED', 'DELIVERED', 'CONVERTED', 'DECLINED']).optional(),
  shippedAt: z.string().optional().nullable(),
  deliveredAt: z.string().optional().nullable(),
}).partial()

// ============================================================
// Follow-up schemas
// ============================================================

export const createFollowUpSchema = z.object({
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  dueDate: z.string(),
  assignedToId: z.string().optional(),
})
