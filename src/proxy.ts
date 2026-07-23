import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes accessible without auth
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/webhooks',
  '/portal', // Customer portal has its own auth
]

const SUPER_ADMIN_ROUTES = ['/admin']

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin route protection
  if (pathname.startsWith('/admin') && !session.user?.isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Inject tenant context header for API routes
  const requestHeaders = new Headers(req.headers)
  if (session.user?.tenantId) {
    requestHeaders.set('x-tenant-id', session.user.tenantId)
  }
  requestHeaders.set('x-user-id', session.user?.id ?? '')
  requestHeaders.set('x-user-role', session.user?.role ?? '')

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
