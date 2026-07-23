import { requireRole } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createTenantSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens'),
  adminName: z.string().min(2, 'Admin name is required'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

export async function GET() {
  try {
    await requireRole('SUPER_ADMIN')
    
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          where: { role: 'COMPANY_ADMIN' },
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return apiSuccess(tenants)
  } catch (error: any) {
    console.error('[TENANTS_GET]', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return apiServerError('Failed to fetch companies')
  }
}

export async function POST(req: Request) {
  try {
    await requireRole('SUPER_ADMIN')
    
    const body = await req.json()
    const validated = createTenantSchema.safeParse(body)
    
    if (!validated.success) {
      return apiError(validated.error.issues[0].message)
    }
    
    const { name, slug, adminName, adminEmail, adminPassword } = validated.data
    
    // Check if tenant slug exists
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    if (existingTenant) return apiError('A company with this slug already exists')
      
    // Check if user email exists
    const existingUser = await prisma.user.findFirst({ where: { email: adminEmail } })
    if (existingUser) return apiError('A user with this admin email already exists')

    const rawPassword = adminPassword || Math.random().toString(36).slice(-12) + 'A1!'
    const hashedPassword = await bcrypt.hash(rawPassword, 12)
    const [firstName, ...lastNameParts] = adminName.split(' ')
    const lastName = lastNameParts.join(' ')

    // Transaction to create Tenant and Admin User together
    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          isActive: true,
          plan: 'STARTER',
        }
      })
      
      await tx.user.create({
        data: {
          email: adminEmail,
          firstName,
          lastName,
          name: adminName,
          passwordHash: hashedPassword,
          role: 'COMPANY_ADMIN',
          tenantId: tenant.id
        }
      })
      
      return tenant
    })
    
    return apiSuccess({
      tenant: newTenant,
      generatedPassword: !adminPassword ? rawPassword : null
    })
    
  } catch (error: any) {
    console.error('[TENANTS_POST]', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return apiServerError('Failed to create company')
  }
}
