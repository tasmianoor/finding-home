import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes - redirect to signin if not authenticated
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if trying to access auth pages while logged in
  if (session && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return res
}

// Protected routes that require authentication
function isProtectedRoute(pathname: string) {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/stories',
    '/add-memories',
    '/timeline'
  ]
  return protectedRoutes.some(route => pathname.startsWith(route))
}

// Auth routes that should not be accessible when logged in
function isAuthRoute(pathname: string) {
  const authRoutes = ['/signin', '/forgot-password']
  return authRoutes.includes(pathname)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 