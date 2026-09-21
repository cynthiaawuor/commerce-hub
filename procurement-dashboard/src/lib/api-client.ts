import { moduleUrls, type Module } from "../config/feature-flags";
import { loadCurrentUser } from "./current-user";

// Error shape both services return: { error: { message, details } }
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

export type MutationResponse<T> = {
  message: string;
  data: T;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(
  module: Module,
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const user = loadCurrentUser();

  const response = await fetch(`${moduleUrls[module]}${path}`, {
    method,
    headers: {
      // Who is acting; the services use this for approvals and the audit trail
      "x-user-id": user.id,
      "x-user-role": user.role,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Some responses (e.g. 204) have no body
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
