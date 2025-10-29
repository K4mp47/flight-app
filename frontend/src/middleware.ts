import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken, isTokenExpired, deleteToken, companyToken } from '@/lib/token'

export async function middleware(request: NextRequest) {

  // lista Route da controllare
  const protectedRoutes = ['/dashboard', '/seatmap', '/profile']

  const token = await getToken()
  
  if (isTokenExpired(token)) {
    await deleteToken()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // check if the user is a passenger trying to access admin_routes
  if (token && request.nextUrl.pathname.startsWith("/dashboard")) {
     if (!await companyToken(token)) {
       return NextResponse.redirect(new URL('/', request.url))
     }
  }

  // Redirect to login if not authenticated and trying to access a protected route
  if (!token && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/seatmap/:path*', '/profile/:path*'], // Protegge tutto sotto /dashboard
}