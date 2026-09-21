import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReorderSuggestionStatus } from "../../types/reorder-suggestion";
import { purchaseOrderKeys } from "../purchase-orders/hooks";
import * as api from "./api";

export const suggestionKeys = {
  all: ["reorder-suggestions"] as const,
  list: (status?: ReorderSuggestionStatus) =>
    ["reorder-suggestions", { status }] as const,
};

export const useSuggestions = (status?: ReorderSuggestionStatus) =>
  useQuery({
    queryKey: suggestionKeys.list(status),
    queryFn: () => api.getSuggestions(status),
  });

export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.dismissSuggestion(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: suggestionKeys.all }),
  });
};

export const useConvertSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.convertSuggestion,
    // Converting creates a purchase order, so both lists are now out of date
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
};
