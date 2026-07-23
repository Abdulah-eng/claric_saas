import { requireTenant } from '@/lib/auth-helpers'
import { apiError, apiForbidden, apiServerError, apiSuccess } from '@/lib/api-response'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    
    // Only admins should connect Stripe
    if (user.role !== 'COMPANY_ADMIN' && !user.isSuperAdmin) {
      return apiForbidden()
    }

    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID
    if (!clientId) {
      return apiError('Stripe client ID is not configured on the platform', 500)
    }

    // We can pass the tenantId in the state parameter to verify it in the callback
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64')
    
    // Stripe Connect Standard OAuth URL
    const stripeConnectUrl = new URL('https://connect.stripe.com/oauth/authorize')
    stripeConnectUrl.searchParams.set('response_type', 'code')
    stripeConnectUrl.searchParams.set('client_id', clientId)
    stripeConnectUrl.searchParams.set('scope', 'read_write')
    stripeConnectUrl.searchParams.set('state', state)
    // Optional: stripeConnectUrl.searchParams.set('redirect_uri', 'YOUR_URL/api/integrations/stripe/callback')
    // It's better to configure this in the Stripe Dashboard, but you can pass it if configured properly.

    return NextResponse.redirect(stripeConnectUrl.toString())
  } catch (error) {
    return apiServerError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    
    if (user.role !== 'COMPANY_ADMIN' && !user.isSuperAdmin) {
      return apiForbidden()
    }

    await prisma.tenantSettings.update({
      where: { tenantId },
      data: { stripeAccountId: null }
    })

    return apiSuccess({ success: true, message: 'Stripe account disconnected successfully' })
  } catch (error) {
    return apiServerError(error)
  }
}
