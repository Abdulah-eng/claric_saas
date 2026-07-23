import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/encryption'
import { requireTenant } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=missing_code', req.url))
    }

    // Mock response for Google Demo (translating OAuth tokens into SMTP usage)
    const mockEmail = 'hello@mycompany.com'
    const mockAccessToken = 'ya29.demo_token_12345'

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        emailFromAddress: mockEmail,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: mockEmail,
        smtpPasswordEncrypted: encrypt(mockAccessToken),
      },
      update: {
        emailFromAddress: mockEmail,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: mockEmail,
        smtpPasswordEncrypted: encrypt(mockAccessToken),
      }
    })

    return NextResponse.redirect(new URL('/dashboard/settings', req.url))
  } catch (error) {
    console.error('Google OAuth Error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }
}
