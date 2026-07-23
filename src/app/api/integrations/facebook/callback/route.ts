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

    // In a real app, you would exchange the `code` for an access token via FB Graph API
    // const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?...`)
    // const data = await res.json()
    // const pageId = data.page_id
    // const accessToken = data.access_token

    // Mock response for the demo
    const mockPageId = 'fb_page_8923749823'
    const mockAccessToken = 'EAA_demo_token_789'

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        facebookPageId: mockPageId,
        facebookAccessTokenEncrypted: encrypt(mockAccessToken),
      },
      update: {
        facebookPageId: mockPageId,
        facebookAccessTokenEncrypted: encrypt(mockAccessToken),
      }
    })

    return NextResponse.redirect(new URL('/dashboard/settings', req.url))
  } catch (error) {
    console.error('Facebook OAuth Error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }
}
