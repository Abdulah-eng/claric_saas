import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const followUpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
}).refine(data => data.customerId || data.leadId, {
  message: "Either customerId or leadId must be provided",
  path: ["customerId"],
});

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const body = await req.json()
    const validated = followUpSchema.safeParse(body)
    
    if (!validated.success) {
      return apiError(validated.error.issues[0].message)
    }

    const data = validated.data
    const followUp = await prisma.followUp.create({
      data: {
        tenantId,
        title: data.title,
        notes: data.notes,
        dueDate: data.dueDate,
        customerId: data.customerId || null,
        leadId: data.leadId || null,
      },
    })

    return apiSuccess(followUp, undefined, 201)
  } catch (error) {
    return apiServerError(error)
  }
}
