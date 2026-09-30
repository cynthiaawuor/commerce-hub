import { apiRequest } from "../../lib/api-client";
import type { ValuationLine, ValuationSummary } from "../../types/inventory";

export const getValuation = async (locationId?: string) => {
  const query = locationId ? `?locationId=${locationId}` : "";
  return (await apiRequest<{ data: ValuationSummary }>(`/valuation${query}`)).data;
};

export const getValuationLines = async (locationId?: string) => {
  const query = locationId ? `?locationId=${locationId}` : "";
  return (await apiRequest<{ data: ValuationLine[] }>(`/valuation/lines${query}`)).data;
};
