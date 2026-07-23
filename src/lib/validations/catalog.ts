import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  basePrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).optional(),
  unit: z.string().default('unit'),
  isTaxable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
})

export const updateProductSchema = createProductSchema.partial()

export const createTierPriceSchema = z.object({
  productId: z.string().min(1),
  minQuantity: z.number().min(1),
  price: z.number().min(0),
})

export const updateTierPriceSchema = createTierPriceSchema.omit({ productId: true }).partial()
