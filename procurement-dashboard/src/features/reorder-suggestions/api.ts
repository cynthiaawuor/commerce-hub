import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type { PurchaseOrder } from "../../types/purchase-order";
import type {
  ReorderSuggestion,
  ReorderSuggestionStatus,
} from "../../types/reorder-suggestion";

const base = "/reorder-suggestions";

export const getSuggestions = async (status?: ReorderSuggestionStatus) => {
  const query = status ? `?status=${status}` : "";
  return (
    await apiRequest<{ data: ReorderSuggestion[] }>("procurement", `${base}${query}`)
  ).data;
};

export const dismissSuggestion = async (id: string, reason: string) =>
  (
    await apiRequest<MutationResponse<ReorderSuggestion>>(
      "procurement",
      `${base}/${id}/dismiss`,
      { method: "POST", body: { reason } },
    )
  ).data;

// Raises a draft order the buyer can review before submitting it
export const convertSuggestion = async (id: string) =>
  (
    await apiRequest<MutationResponse<PurchaseOrder>>(
      "procurement",
      `${base}/${id}/convert`,
      { method: "POST" },
    )
  ).data;
