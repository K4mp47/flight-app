import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function fetcher<T>(url: string, method: HttpMethod = "GET", body?: Record<string, unknown>): Promise<T> {
  
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  console.log('API Request:', method, `${API_BASE_URL}${url}`, body ? JSON.stringify(body, null, 2) : '');

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token ?? ""}`,
    },
    body: body && (method === 'POST' || method === 'PUT' || method === 'DELETE') ? JSON.stringify(body) : undefined,
  });

  console.log('API Response status:', res.status, res.statusText);

  if (!res.ok) {
    let errorMessage = `${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      console.error('API error data:', errorData);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      console.error('Could not parse error response:', e);
    }
    toast.error(`API error: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const data = await res.json() as T;
  console.log('API Response data:', data);
  return data;
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url, "GET"),
  post: <T>(url: string, body: Record<string, unknown>) => fetcher<T>(url, "POST", body),
  put: <T>(url: string, body: Record<string, unknown>) => fetcher<T>(url, "PUT", body),
  delete: <T>(url: string, body?: Record<string, unknown>) => fetcher<T>(url, "DELETE", body),
}