import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

  // lista Route da controllare
  const protectedRoutes = ['/dashboard', '/seatmap']

  const token = request.cookies.get('token')?.value

  if (!token && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/seatmap/:path*'], // Protegge tutto sotto /dashboard
}