import { z } from 'zod'

export const updateProductionJobSchema = z.object({
  stage: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELLED']).optional(),
  assignedToId: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export const createProductionTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
})

export const updateProductionTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELLED']).optional(),
  actualHours: z.number().min(0).optional(),
})

export const createQualityCheckSchema = z.object({
  checkName: z.string().min(1, 'Check name is required'),
})

export const updateQualityCheckSchema = z.object({
  isPassed: z.boolean().optional(),
  notes: z.string().optional(),
})
