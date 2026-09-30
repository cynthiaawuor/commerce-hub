import { config } from "../core/config";

// What service-pos returns for GET /registers/:registerCode/summary
export type RegisterSummary = {
  registerCode: string;
  date: string;
  salesCount: number;
  totalCents: number;
  cashCents: number;
  cardCents: number;
};

// Asks Point of Sale what it recorded for a register's day, so a close is not signed
// off while sales are still on their way here.
// Returns null when Point of Sale cannot be reached: the close then goes ahead on the
// figures the events delivered, and is marked as unchecked. A shop must be able to
// close its tills even when another system is down.
const getRegisterSummary = async (
  registerCode: string,
  date: string,
): Promise<RegisterSummary | null> => {
  const path = `/registers/${encodeURIComponent(registerCode)}/summary?date=${date}`;

  try {
    const response = await fetch(`${config.posApiUrl}${path}`, {
      headers: { "x-user-id": "sales-audit-service", "x-user-role": "SYSTEM" },
      signal: AbortSignal.timeout(config.posTimeoutMs),
    });

    if (!response.ok) {
      console.error(`Point of Sale responded with ${response.status} for ${path}`);
      return null;
    }

    return ((await response.json()) as { data: RegisterSummary }).data;
  } catch (err) {
    console.error(`Point of Sale request failed: ${path}`, err);
    return null;
  }
};

export { getRegisterSummary };
