import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { createProductionTaskSchema } from '@/lib/validations/production'
import { getProductionJobById } from '@/lib/queries/production'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id: jobId } = await params
    const job = await getProductionJobById(tenantId, jobId)
    if (!job) return apiNotFound('Production Job')

    const body = await req.json()
    const data = createProductionTaskSchema.parse(body)

    const task = await prisma.productionTask.create({
      data: {
        jobId,
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        estimatedHours: data.estimatedHours,
        status: 'PENDING',
      },
    })

    return apiSuccess(task, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
