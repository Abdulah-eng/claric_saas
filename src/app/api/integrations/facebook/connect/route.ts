import { requireTenant } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    // In a real app, this redirects to:
    // https://www.facebook.com/v19.0/dialog/oauth?client_id=...&redirect_uri=...&scope=pages_manage_metadata,pages_messaging
    
    // For the demo video, we mock the redirect directly to our callback
    const callbackUrl = new URL('/api/integrations/facebook/callback', req.url)
    callbackUrl.searchParams.set('code', 'demo_fb_oauth_code_123')
    callbackUrl.searchParams.set('state', tenantId)
    
    return NextResponse.redirect(callbackUrl.toString())
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    await prisma.tenantSettings.update({
      where: { tenantId },
      data: {
        facebookPageId: null,
        facebookAccessTokenEncrypted: null,
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
