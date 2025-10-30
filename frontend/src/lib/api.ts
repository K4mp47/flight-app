import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function fetcher<T>(url: string, method: HttpMethod = "GET", body?: Record<string, unknown>): Promise<T> {
  
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  console.log('API Request:', method, url, body ? JSON.stringify(body) : '');

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token ?? ""}`,
    },
    body: body && (method === 'POST' || method === 'PUT' || method === 'DELETE') ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    toast.error(`API error: ${res.status} ${res.statusText}`);
    console.error(`API error: ${res.status} ${res.statusText}`);
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json() as T;
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url, "GET"),
  post: <T>(url: string, body: Record<string, unknown>) => fetcher<T>(url, "POST", body),
  put: <T>(url: string, body: Record<string, unknown>) => fetcher<T>(url, "PUT", body),
  delete: <T>(url: string, body?: Record<string, unknown>) => fetcher<T>(url, "DELETE", body),
}