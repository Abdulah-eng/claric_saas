import { requireTenant } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    // Microsoft Office 365 OAuth Flow
    const callbackUrl = new URL('/api/integrations/microsoft/callback', req.url)
    callbackUrl.searchParams.set('code', 'demo_microsoft_code_123')
    
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
        office365User: null,
        office365AccessTokenEncrypted: null,
        office365RefreshTokenEncrypted: null,
        office365TokenExpiresAt: null,
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
