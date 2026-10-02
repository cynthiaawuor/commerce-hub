import { config } from "../core/config";

// The one thing Financials reads from Inventory: what a product cost on average.
// Financials never touches Inventory's database.
type InventoryProduct = { id: string; averageCostCents: number };

// Asks Inventory what a product costs. Throws with a reason when it cannot be found
// out, so the sale stays waiting and is tried again later: booking a guessed cost
// would put a wrong profit in the books.
const getAverageCostCents = async (productId: string): Promise<number> => {
  const path = `/products/${encodeURIComponent(productId)}`;
  let response: Response;

  try {
    response = await fetch(`${config.inventoryApiUrl}${path}`, {
      headers: { "x-user-id": "financials-service", "x-user-role": "SYSTEM" },
      signal: AbortSignal.timeout(config.inventoryTimeoutMs),
    });
  } catch {
    throw new Error("Inventory is unavailable");
  }

  if (response.status === 404) {
    throw new Error(`Inventory has no product ${productId}`);
  }

  if (!response.ok) {
    throw new Error(`Inventory responded with ${response.status}`);
  }

  const product = ((await response.json()) as { data?: InventoryProduct }).data;

  if (!product || !Number.isInteger(product.averageCostCents) || product.averageCostCents < 0) {
    throw new Error(`Inventory gave no usable cost for product ${productId}`);
  }

  return product.averageCostCents;
};

export { getAverageCostCents };
