import { env } from "../config/env";

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

export type MutationResponse<T> = { message: string; data: T };

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

// Who is acting. There is no auth service yet, and the API records this against every
// stock movement, so the ledger says who counted or corrected a quantity.
const CURRENT_USER = "stock-controller@commerce.test";

export async function apiRequest<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${env.inventoryApiUrl}${path}`, {
    method,
    headers: {
      "x-user-id": CURRENT_USER,
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
