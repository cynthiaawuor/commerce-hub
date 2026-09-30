import type { ExpectedDelivery, GoodsReceivedNote } from "../types/receiving";
import { apiRequest } from "./api-client";

export const getOpenDeliveries = async () =>
  (await apiRequest<{ data: ExpectedDelivery[] }>("/expected-deliveries")).data;

export type CountedProduct = {
  productId: string;
  quantityDelivered: number;
  quantityDamaged: number;
};

export const submitGoodsReceivedNote = async (input: {
  expectedDeliveryId: string;
  products: CountedProduct[];
  notes?: string;
}) =>
  (
    await apiRequest<{ data: GoodsReceivedNote }>("/goods-received-notes", {
      method: "POST",
      body: input,
    })
  ).data;
