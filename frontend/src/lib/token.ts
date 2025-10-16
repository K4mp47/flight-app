import 'server-only'
import { cookies } from 'next/headers'
 
export async function deleteToken() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
}

export async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('token')?.value
}

// token expired?
export function isTokenExpired(token: string | undefined): boolean {
  if (!token) return false;
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log("Token expiry:" + new Date(payload.exp * 1000) + " Current time: " + new Date());
  return payload.exp * 1000 < Date.now();
}

export async function companyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role === 'Airline-Admin';
}