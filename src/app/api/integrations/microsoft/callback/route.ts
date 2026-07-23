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

    // Mock response for Microsoft Demo
    const mockEmail = 'hello@microsoft-demo.com'
    const mockAccessToken = 'eyJ0eXAiOiJKV1QiLC...mock_token'

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        emailFromAddress: mockEmail,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpUser: mockEmail,
        smtpPasswordEncrypted: encrypt(mockAccessToken),
        office365User: mockEmail,
        office365AccessTokenEncrypted: encrypt(mockAccessToken),
      },
      update: {
        emailFromAddress: mockEmail,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpUser: mockEmail,
        smtpPasswordEncrypted: encrypt(mockAccessToken),
        office365User: mockEmail,
        office365AccessTokenEncrypted: encrypt(mockAccessToken),
      }
    })

    return NextResponse.redirect(new URL('/dashboard/settings', req.url))
  } catch (error) {
    console.error('Microsoft OAuth Error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }
}
