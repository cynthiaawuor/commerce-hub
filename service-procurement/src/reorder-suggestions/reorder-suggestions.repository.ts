import { db } from "../prisma/db";
import type { ReorderSuggestionStatus } from "./reorder-suggestion-status";

const ReorderSuggestion = db.orm.public.ReorderSuggestion;

type ReportedShortage = {
  productId: string;
  productName: string;
  locationId: string;
  quantityAvailable: number;
  reorderPoint: number;
  suggestedQuantity: number;
};

const findById = async (id: string) => ReorderSuggestion.where({ id }).first();

const findByProductAndLocation = async (
  productId: string,
  locationId: string,
) => ReorderSuggestion.where({ productId, locationId }).first();

// Newest report first: the most recent shortage is the most urgent
const findAll = async (status?: ReorderSuggestionStatus | undefined) => {
  let suggestions = ReorderSuggestion.where((s) => s.id.isNotNull());

  if (status) {
    suggestions = suggestions.where({ status });
  }

  return suggestions.orderBy((s) => s.lastReportedAt.desc()).all();
};

const insert = async (shortage: ReportedShortage) =>
  ReorderSuggestion.create({
    ...shortage,
    lastReportedAt: new Date().toISOString(),
  });

// A repeat report refreshes the numbers and reopens a suggestion that was dismissed or
// already converted: the product is low again, so a buyer should look at it again.
const refresh = async (id: string, shortage: ReportedShortage) =>
  ReorderSuggestion.where({ id }).update({
    ...shortage,
    status: "OPEN",
    purchaseOrderId: null,
    dismissedBy: null,
    dismissReason: null,
    lastReportedAt: new Date().toISOString(),
  });

const markDismissed = async (
  id: string,
  dismissedBy: string,
  reason: string | null,
) =>
  ReorderSuggestion.where({ id }).update({
    status: "DISMISSED",
    dismissedBy,
    dismissReason: reason,
  });

const markConverted = async (id: string, purchaseOrderId: string) =>
  ReorderSuggestion.where({ id }).update({
    status: "CONVERTED",
    purchaseOrderId,
  });

export {
  findAll,
  findById,
  findByProductAndLocation,
  insert,
  markConverted,
  markDismissed,
  refresh,
  type ReportedShortage,
};
