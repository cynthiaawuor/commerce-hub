import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type { Location, StockLevel, StockMovement } from "../../types/inventory";

export const getLocations = async () =>
  (await apiRequest<{ data: Location[] }>("/locations")).data;

export const createLocation = async (input: { code: string; name: string }) =>
  (await apiRequest<MutationResponse<Location>>("/locations", {
    method: "POST",
    body: input,
  })).data;

export const getStockByProduct = async (productId: string) =>
  (await apiRequest<{ data: StockLevel[] }>(`/stock?productId=${productId}`)).data;

export const getStockByLocation = async (locationId: string) =>
  (await apiRequest<{ data: StockLevel[] }>(`/stock?locationId=${locationId}`)).data;

export const getMovements = async (productId: string) =>
  (await apiRequest<{ data: StockMovement[] }>(
    `/stock/movements?productId=${productId}&limit=20`,
  )).data;

export type AdjustmentInput = {
  productId: string;
  locationId: string;
  quantity: number;
  reason: string;
  reference?: string;
};

export const adjustStock = async (input: AdjustmentInput) =>
  (await apiRequest<MutationResponse<StockLevel>>("/stock/adjustments", {
    method: "POST",
    body: input,
  })).data;
