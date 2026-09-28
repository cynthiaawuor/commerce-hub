import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

export const stockKeys = {
  all: ["stock"] as const,
  byProduct: (productId: string) => ["stock", "product", productId] as const,
  byLocation: (locationId: string) => ["stock", "location", locationId] as const,
  movements: (productId: string) => ["stock", "movements", productId] as const,
};

export const useLocations = () =>
  useQuery({ queryKey: ["locations"], queryFn: api.getLocations });

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
};

export const useStockByProduct = (productId: string) =>
  useQuery({
    queryKey: stockKeys.byProduct(productId),
    queryFn: () => api.getStockByProduct(productId),
    enabled: Boolean(productId),
  });

export const useStockByLocation = (locationId: string) =>
  useQuery({
    queryKey: stockKeys.byLocation(locationId),
    queryFn: () => api.getStockByLocation(locationId),
    enabled: Boolean(locationId),
  });

export const useMovements = (productId: string) =>
  useQuery({
    queryKey: stockKeys.movements(productId),
    queryFn: () => api.getMovements(productId),
    enabled: Boolean(productId),
  });

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.adjustStock,
    // An adjustment changes levels, the ledger and what the stock is worth
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: ["valuation"] });
    },
  });
};
