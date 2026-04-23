export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message : "Erro na requisição";
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

