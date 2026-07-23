import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiForbidden } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const { tenantId } = await requireTenant()

    const [settings, whiteLabel, company] = await Promise.all([
      prisma.tenantSettings.upsert({
        where: { tenantId },
        create: { tenantId },
        update: {},
        include: { tenant: { include: { qbConnections: true } } }
      }),
      prisma.whiteLabelConfig.upsert({
        where: { tenantId },
        create: { tenantId },
        update: {}
      }),
      prisma.company.findUnique({
        where: { tenantId }
      })
    ])

    return apiSuccess({ settings, whiteLabel, company })
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    if (!user.isSuperAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
      return apiForbidden()
    }

    const body = await req.json()
    const { settings, whiteLabel, company } = body

    const result = await prisma.$transaction(async (tx) => {
      let updatedSettings, updatedWhiteLabel, updatedCompany

      if (settings) {
        // Encrypt secrets if they were modified (meaning they don't contain our delimiter ':')
        const sensitiveFields = [
          'stripeSecretKeyEncrypted',
          'squareAccessTokenEncrypted',
          'smtpPasswordEncrypted',
          'resendApiKeyEncrypted',
          'twilioAuthTokenEncrypted',
          'facebookAccessTokenEncrypted',
          'office365AccessTokenEncrypted',
          'office365RefreshTokenEncrypted'
        ]

        for (const field of sensitiveFields) {
          if (settings[field] && !settings[field].includes(':') && settings[field] !== '********') {
            settings[field] = encrypt(settings[field])
          } else if (settings[field] === '********') {
            delete settings[field] // don't override with mask
          }
        }

        updatedSettings = await tx.tenantSettings.update({
          where: { tenantId },
          data: settings
        })
      }

      if (whiteLabel) {
        updatedWhiteLabel = await tx.whiteLabelConfig.update({
          where: { tenantId },
          data: whiteLabel
        })
      }

      if (company) {
        updatedCompany = await tx.company.update({
          where: { tenantId },
          data: company
        })
      }

      return { settings: updatedSettings, whiteLabel: updatedWhiteLabel, company: updatedCompany }
    })

    return apiSuccess(result)
  } catch (e) {
    return apiServerError(e)
  }
}
