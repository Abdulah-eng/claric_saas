import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/encryption'
import { requireTenant } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')

    if (!code || !realmId) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=missing_code', req.url))
    }

    // Mock response for QuickBooks Demo
    const mockAccessToken = 'eyJ0eXAiOiJKV1QiLC...mock_qb_token'
    const mockRefreshToken = 'mock_qb_refresh_token'

    // Tokens expire in 1 hr and 100 days respectively typically
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)

    await prisma.quickBooksConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        realmId,
        accessTokenEncrypted: encrypt(mockAccessToken),
        refreshTokenEncrypted: encrypt(mockRefreshToken),
        tokenExpiresAt,
        refreshExpiresAt,
      },
      update: {
        realmId,
        accessTokenEncrypted: encrypt(mockAccessToken),
        refreshTokenEncrypted: encrypt(mockRefreshToken),
        tokenExpiresAt,
        refreshExpiresAt,
      }
    })

    return NextResponse.redirect(new URL('/dashboard/settings', req.url))
  } catch (error) {
    console.error('QuickBooks OAuth Error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }
}
