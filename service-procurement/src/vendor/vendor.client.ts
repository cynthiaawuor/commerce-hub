import { config } from "../core/config";
import { ServiceUnavailableError } from "../core/http-error";

// What service-vendor returns. Procurement only reads these fields; it never writes
// to Vendor Management and never touches its database.
export type VendorSupplier = {
  id: string;
  name: string;
  paymentTerms: string;
  status: string;
};

export type SupplierOffer = {
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  catalogItemId: string;
  productId: string;
  productName: string;
  // KES, as a float; convert with toCents() before storing
  unitPrice: number;
  leadTimeDays: number;
};

// Returns null for 404 so callers can turn "no such supplier" into their own error,
// and throws 503 when Vendor Management itself is unreachable: the caller's request
// is fine, the dependency is not.
const get = async <T>(path: string): Promise<T | null> => {
  let response: Response;

  try {
    response = await fetch(`${config.vendorApiUrl}${path}`, {
      signal: AbortSignal.timeout(config.vendorTimeoutMs),
    });
  } catch (err) {
    console.error(`Vendor Management request failed: ${path}`, err);
    throw new ServiceUnavailableError(
      "Vendor Management is unavailable. Please try again shortly.",
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ServiceUnavailableError(
      `Vendor Management responded with ${response.status}`,
    );
  }

  return (await response.json()) as T;
};

const getSupplier = (supplierId: string) =>
  get<VendorSupplier>(`/suppliers/${encodeURIComponent(supplierId)}`);

// Every active supplier approved to provide this product, cheapest first
const getProductSuppliers = async (productId: string) =>
  (await get<SupplierOffer[]>(
    `/products/${encodeURIComponent(productId)}/suppliers`,
  )) ?? [];

export { getProductSuppliers, getSupplier };
