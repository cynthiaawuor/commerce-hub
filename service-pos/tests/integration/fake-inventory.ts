import { ConflictError, NotFoundError } from "../../src/core/http-error";

// A stand-in for service-inventory, kept in memory: enough to check that the till
// reserves, releases and commits the right stock, without running Inventory.

type Hold = { productId: string; quantity: number; status: "ACTIVE" | "RELEASED" | "COMMITTED" | "EXPIRED" };

const PRODUCTS = [
  { id: "prod-rice", sku: "RICE-1KG", name: "Rice 1kg", isActive: true },
  { id: "prod-oil", sku: "OIL-5L", name: "Cooking oil 5L", isActive: true },
  { id: "prod-old", sku: "OLD-1", name: "Discontinued soap", isActive: false },
];

const state = {
  available: new Map<string, number>(),
  onHand: new Map<string, number>(),
  holds: new Map<string, Hold>(),
};

const reset = () => {
  state.available = new Map([["prod-rice", 10], ["prod-oil", 5]]);
  state.onHand = new Map([["prod-rice", 10], ["prod-oil", 5]]);
  state.holds = new Map();
};

const getProductBySku = async (sku: string) => {
  const product = PRODUCTS.find((p) => p.sku === sku);

  if (!product) {
    throw new NotFoundError(`Product with SKU ${sku} not found`);
  }

  return product;
};

const reserve = async (productId: string, quantity: number) => {
  const available = state.available.get(productId) ?? 0;

  if (available < quantity) {
    throw new ConflictError(`Only ${available} available at this location, ${quantity} requested`);
  }

  const id = `hold-${state.holds.size + 1}`;
  state.holds.set(id, { productId, quantity, status: "ACTIVE" });
  state.available.set(productId, available - quantity);

  return { id, quantity, status: "ACTIVE" };
};

const resolve = (id: string, status: "RELEASED" | "COMMITTED") => {
  const hold = state.holds.get(id);

  if (!hold) {
    throw new NotFoundError(`Reservation with ID ${id} not found`);
  }

  if (hold.status !== "ACTIVE") {
    throw new ConflictError(`Reservation ${id} is ${hold.status.toLowerCase()} and cannot be used`);
  }

  hold.status = status;

  if (status === "RELEASED") {
    state.available.set(hold.productId, (state.available.get(hold.productId) ?? 0) + hold.quantity);
  } else {
    state.onHand.set(hold.productId, (state.onHand.get(hold.productId) ?? 0) - hold.quantity);
  }

  return { id, quantity: hold.quantity, status };
};

const commit = async (id: string) => resolve(id, "COMMITTED");
const release = async (id: string) => resolve(id, "RELEASED");

// What Inventory's sweeper does to a hold nobody came back for
const expire = (id: string) => {
  const hold = state.holds.get(id)!;
  hold.status = "EXPIRED";
  state.available.set(hold.productId, (state.available.get(hold.productId) ?? 0) + hold.quantity);
};

export const fakeInventory = { commit, expire, getProductBySku, release, reserve, reset, state };
