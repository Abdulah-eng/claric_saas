import { requireTenant } from '@/lib/auth-helpers'
import { apiError, apiServerError } from '@/lib/api-response'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia' as any,
})

export async function GET(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const { searchParams } = new URL(req.url)
    
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard/settings?tab=payments&stripeError=${encodeURIComponent(error_description || error)}`, req.url))
    }

    if (!code) {
      return apiError('No authorization code provided', 400)
    }

    // Optional verification: check state
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
        if (decodedState.tenantId !== tenantId) {
          return apiError('State mismatch', 400)
        }
      } catch (e) {
        // Invalid state
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return apiError('Stripe secret key is not configured on the platform', 500)
    }

    // Exchange the authorization code for the Stripe Account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })

    if (!response.stripe_user_id) {
      throw new Error('No Stripe user ID returned from OAuth exchange')
    }

    // Save the stripe_user_id to the TenantSettings
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        stripeAccountId: response.stripe_user_id
      },
      update: {
        stripeAccountId: response.stripe_user_id
      }
    })

    // Redirect back to the settings page
    return NextResponse.redirect(new URL('/dashboard/settings?tab=payments&stripeConnected=true', req.url))
  } catch (error: any) {
    console.error('Stripe OAuth callback error:', error)
    return NextResponse.redirect(new URL(`/dashboard/settings?tab=payments&stripeError=${encodeURIComponent(error.message || 'Unknown error')}`, req.url))
  }
}
