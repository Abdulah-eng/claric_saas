import { requireAuth } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return apiError('Invalid request data')
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || !dbUser.passwordHash) {
      return apiError('User not found or using OAuth')
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!isValid) {
      return apiError('Incorrect current password')
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })

    return apiSuccess({ success: true })
  } catch (error) {
    return apiServerError(error)
  }
}
