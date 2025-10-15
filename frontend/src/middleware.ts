import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken, isTokenExpired, deleteToken } from '@/lib/token'

export async function middleware(request: NextRequest) {

  // lista Route da controllare
  const protectedRoutes = ['/dashboard', '/seatmap']

  const token = await getToken()
  
  if (isTokenExpired(token)) {
    await deleteToken()
    return NextResponse.redirect(new URL('/login', request.url))
  }


  // Redirect to login if not authenticated and trying to access a protected route
  if (!token && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/seatmap/:path*'], // Protegge tutto sotto /dashboard
}