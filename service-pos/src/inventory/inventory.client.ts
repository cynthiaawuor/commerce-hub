import { config } from "../core/config";
import { ConflictError, NotFoundError, ServiceUnavailableError } from "../core/http-error";

// What service-inventory returns. The till only reads these fields; it never touches
// Inventory's database.
export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
};

type InventoryLocation = { id: string; code: string };

export type Reservation = { id: string; quantity: number; status: string };

// The till is a system user to Inventory: the cashier is recorded on the sale here,
// and the reservation's reference points back to it.
const HEADERS = {
  "x-user-id": "pos-service",
  "x-user-role": "SYSTEM",
  "Content-Type": "application/json",
};

// Inventory's own 404 and 409 messages ("Only 2 available at this location") are
// passed on to the cashier as they are. Anything else means Inventory is not working,
// which is a 503: the cashier's request was fine.
const request = async <T>(
  path: string,
  { method = "GET", body }: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${config.inventoryApiUrl}${path}`, {
      method,
      headers: HEADERS,
      body: body === undefined ? null : JSON.stringify(body),
      signal: AbortSignal.timeout(config.inventoryTimeoutMs),
    });
  } catch (err) {
    console.error(`Inventory request failed: ${method} ${path}`, err);
    throw new ServiceUnavailableError("Inventory is unavailable. Please try again shortly.");
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string };
  } | null;
  const message = payload?.error?.message ?? `Inventory responded with ${response.status}`;

  if (response.status === 404) {
    throw new NotFoundError(message);
  }

  if (response.status === 409) {
    throw new ConflictError(message);
  }

  if (!response.ok || payload?.data === undefined) {
    throw new ServiceUnavailableError(message);
  }

  return payload.data;
};

const getProductBySku = (sku: string) =>
  request<InventoryProduct>(`/products/sku/${encodeURIComponent(sku)}`);

// Inventory wants the store's id; people know it by its code. Looked up once and kept,
// since a store's id never changes.
let storeLocationId: string | null = null;

const getStoreLocationId = async () => {
  if (storeLocationId) {
    return storeLocationId;
  }

  const locations = await request<InventoryLocation[]>("/locations");
  const store = locations.find((location) => location.code === config.storeLocationCode);

  if (!store) {
    throw new ServiceUnavailableError(
      `Inventory has no location ${config.storeLocationCode}; check STORE_LOCATION_CODE`,
    );
  }

  storeLocationId = store.id;
  return storeLocationId;
};

// Holds the stock so no other channel can sell it while the customer pays
const reserve = async (productId: string, quantity: number, saleNumber: string) =>
  request<Reservation>("/reservations", {
    method: "POST",
    body: {
      productId,
      locationId: await getStoreLocationId(),
      quantity,
      reference: saleNumber,
    },
  });

// The sale is paid: the stock actually leaves the store
const commit = (reservationId: string) =>
  request<Reservation>(`/reservations/${encodeURIComponent(reservationId)}/commit`, {
    method: "POST",
  });

// The product came off the sale: the stock can be sold again
const release = (reservationId: string) =>
  request<Reservation>(`/reservations/${encodeURIComponent(reservationId)}/release`, {
    method: "POST",
  });

export { commit, getProductBySku, release, reserve };
