import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiForbidden, parsePagination, parseSearchParams } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES_REP', 'PRODUCTION_MANAGER', 'DESIGNER', 'FINANCE_STAFF', 'CUSTOMER']),
  password: z.string().min(8),
})

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { q } = parseSearchParams(req.url)
    const { page, perPage } = parsePagination(req.url)
    const skip = (page - 1) * perPage

    const where: any = {
      tenantId,
      ...(q && {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ]
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true }
      }),
      prisma.user.count({ where })
    ])

    return apiSuccess(users, { total, page, perPage })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user: currentUser, tenantId } = await requireTenant()
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'COMPANY_ADMIN') {
      return apiForbidden()
    }

    const body = await req.json()
    const data = createUserSchema.parse(body)

    const existing = await prisma.user.findFirst({ where: { email: data.email, tenantId } })
    if (existing) return apiServerError(new Error('User with this email already exists'))

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        role: data.role,
        passwordHash,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
    })

    return apiSuccess(user, undefined, 201)
  } catch (e) {
    return apiServerError(e)
  }
}
