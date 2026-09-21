// Mirrors the ReorderSuggestionStatus enum in contract.prisma
const REORDER_SUGGESTION_STATUSES = ["OPEN", "DISMISSED", "CONVERTED"] as const;

type ReorderSuggestionStatus = (typeof REORDER_SUGGESTION_STATUSES)[number];

export { REORDER_SUGGESTION_STATUSES, type ReorderSuggestionStatus };
