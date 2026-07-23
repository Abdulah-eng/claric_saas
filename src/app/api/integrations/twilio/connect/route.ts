import { requireTenant } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    // Twilio Connect OAuth Flow
    const callbackUrl = new URL('/api/integrations/twilio/callback', req.url)
    callbackUrl.searchParams.set('code', 'demo_twilio_code_456')
    
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
        twilioAccountSid: null,
        twilioAuthTokenEncrypted: null,
        twilioPhoneNumber: null,
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
