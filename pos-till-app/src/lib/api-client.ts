import { config } from "../config/config";

// Error shape the service returns: { error: { message, details } }
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Who is at the till. There is no auth service yet; the service records this on
// every sale.
export const CURRENT_USER = "cashier@commerce.test";

export async function apiRequest<T>(
  path: string,
  { method = "GET", body }: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${config.posApiUrl}${path}`, {
    method,
    headers: {
      "x-user-id": CURRENT_USER,
      "x-user-role": "CASHIER",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      payload?.error?.details,
    );
  }

  return payload as T;
}
