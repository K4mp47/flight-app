import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isTokenExpired(token: string | undefined): boolean {
  if (!token) return false;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
}


export function middleware(request: NextRequest) {

  // lista Route da controllare
  // const protectedRoutes = ['/dashboard', '/seatmap']

  let token = request.cookies.get('token')?.value

  // Remove expired cookie
  if (isTokenExpired(token)) {
    request.cookies.set('token', '');
    token = undefined; // Reset token if expired
  }


  // if (!token && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/seatmap/:path*'], // Protegge tutto sotto /dashboard
}