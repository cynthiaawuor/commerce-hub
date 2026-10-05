import type { PaymentMethod, ProductPrice, Sale } from "../types/pos";
import { apiRequest } from "./api-client";

export const getPrices = async () =>
  (await apiRequest<{ data: ProductPrice[] }>("/prices")).data;

export const openSale = async (registerCode: string) =>
  (await apiRequest<{ data: Sale }>("/sales", { method: "POST", body: { registerCode } })).data;

export const addProduct = async ({
  saleId,
  sku,
  quantity,
}: {
  saleId: string;
  sku: string;
  quantity: number;
}) =>
  (
    await apiRequest<{ data: Sale }>(`/sales/${saleId}/products`, {
      method: "POST",
      body: { sku, quantity },
    })
  ).data;

export const removeProduct = async ({
  saleId,
  saleProductId,
}: {
  saleId: string;
  saleProductId: string;
}) =>
  (
    await apiRequest<{ data: Sale }>(`/sales/${saleId}/products/${saleProductId}`, {
      method: "DELETE",
    })
  ).data;

export const paySale = async ({
  saleId,
  payments,
}: {
  saleId: string;
  payments: { method: PaymentMethod; amountCents: number }[];
}) =>
  (
    await apiRequest<{ data: Sale }>(`/sales/${saleId}/pay`, {
      method: "POST",
      body: { payments },
    })
  ).data;

export const cancelSale = async (saleId: string) =>
  (await apiRequest<{ data: Sale }>(`/sales/${saleId}/cancel`, { method: "POST" })).data;
