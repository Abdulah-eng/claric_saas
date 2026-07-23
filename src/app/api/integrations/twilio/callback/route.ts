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

    // Mock response for Twilio Demo
    const mockSid = 'AC_demo_account_sid_000'
    const mockAuthToken = 'demo_auth_token_456'
    const mockPhone = '+15551234567'

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        twilioAccountSid: mockSid,
        twilioAuthTokenEncrypted: encrypt(mockAuthToken),
        twilioPhoneNumber: mockPhone,
      },
      update: {
        twilioAccountSid: mockSid,
        twilioAuthTokenEncrypted: encrypt(mockAuthToken),
        twilioPhoneNumber: mockPhone,
      }
    })

    return NextResponse.redirect(new URL('/dashboard/settings', req.url))
  } catch (error) {
    console.error('Twilio OAuth Error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }
}
