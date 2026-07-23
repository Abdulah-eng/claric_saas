import { requireTenant } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    // Quickbooks OAuth Flow
    const callbackUrl = new URL('/api/integrations/quickbooks/callback', req.url)
    callbackUrl.searchParams.set('code', 'demo_quickbooks_code_456')
    callbackUrl.searchParams.set('realmId', '1234567890')
    
    return NextResponse.redirect(callbackUrl.toString())
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    
    await prisma.quickBooksConnection.deleteMany({
      where: { tenantId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
