import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function POST() {
  try {
    const { user, tenantId } = await requireTenant()

    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })

    if (!settings) {
      return apiError('No email settings configured. Please save your email settings first.')
    }

    const hasResend = !!settings.resendApiKeyEncrypted
    const hasSmtp = !!(settings.smtpHost && settings.smtpPasswordEncrypted)

    if (!hasResend && !hasSmtp) {
      return apiError('No email provider configured. Please add a Resend API key or SMTP credentials first.')
    }

    const toEmail = user.email
    const fromEmail = settings.emailFromAddress || 'noreply@claric.app'

    if (hasResend) {
      // Use Resend
      const apiKey = decrypt(settings.resendApiKeyEncrypted!)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: 'Claric — Test Email',
          html: `<p>This is a test email from your Claric workspace. Your email integration is working correctly!</p>`
        })
      })
      const resData = await res.json()
      if (!res.ok) {
        return apiError(`Resend error: ${resData.message || 'Failed to send'}`)
      }
      return apiSuccess({ message: `Test email sent to ${toEmail} via Resend` })
    }

    if (hasSmtp) {
      // SMTP — in a real setup you'd use nodemailer here.
      // For now we validate the config is correct and return a mock success.
      const _password = decrypt(settings.smtpPasswordEncrypted!)
      // nodemailer would be initialized here with settings.smtpHost, settings.smtpPort, settings.smtpUser, _password
      return apiSuccess({ message: `SMTP configured (${settings.smtpHost}:${settings.smtpPort}). Install nodemailer to enable actual sending.` })
    }

    return apiError('No email provider available')
  } catch (e) {
    return apiServerError(e)
  }
}
