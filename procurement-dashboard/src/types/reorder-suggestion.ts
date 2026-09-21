export type ReorderSuggestionStatus = "OPEN" | "DISMISSED" | "CONVERTED";

export type ReorderSuggestion = {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  quantityAvailable: number;
  reorderPoint: number;
  suggestedQuantity: number;
  status: ReorderSuggestionStatus;
  purchaseOrderId: string | null;
  lastReportedAt: string;
};
