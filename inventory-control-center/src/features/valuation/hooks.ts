import { useQuery } from "@tanstack/react-query";
import * as api from "./api";

export const useValuation = (locationId: string) =>
  useQuery({
    queryKey: ["valuation", "summary", locationId],
    queryFn: () => api.getValuation(locationId || undefined),
  });

export const useValuationLines = (locationId: string) =>
  useQuery({
    queryKey: ["valuation", "lines", locationId],
    queryFn: () => api.getValuationLines(locationId || undefined),
  });
