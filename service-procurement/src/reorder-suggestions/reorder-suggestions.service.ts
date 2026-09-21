import type { CurrentUser } from "../core/current-user";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as purchaseOrderService from "../purchase-orders/purchase-orders.service";
import * as vendorClient from "../vendor/vendor.client";
import { DismissSuggestionDto } from "./dtos/dismiss-suggestion.dto";
import type { ReorderSuggestionStatus } from "./reorder-suggestion-status";
import * as reorderSuggestionRepository from "./reorder-suggestions.repository";
import type { ReportedShortage } from "./reorder-suggestions.repository";

// Called by the StockLow consumer. Keyed on product and location, so a product Inventory
// reports repeatedly stays a single entry in the buyer's list.
const recordShortage = async (shortage: ReportedShortage) => {
  const existing = await reorderSuggestionRepository.findByProductAndLocation(
    shortage.productId,
    shortage.locationId,
  );

  if (existing) {
    return reorderSuggestionRepository.refresh(existing.id, shortage);
  }

  return reorderSuggestionRepository.insert(shortage);
};

const listSuggestions = async (status?: ReorderSuggestionStatus | undefined) =>
  reorderSuggestionRepository.findAll(status);

const getSuggestion = async (id: string) => {
  const suggestion = await reorderSuggestionRepository.findById(id);

  if (!suggestion) {
    throw new NotFoundError(`Reorder suggestion with ID ${id} not found`);
  }

  return suggestion;
};

// A buyer who decides not to order: there may be stock elsewhere, or the product is
// being discontinued.
const dismissSuggestion = async (
  id: string,
  body: unknown,
  user: CurrentUser,
) => {
  const { obj, errors } = await parseAndValidate(DismissSuggestionDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable dismissal", errors);
  }

  const suggestion = await getSuggestion(id);

  if (suggestion.status !== "OPEN") {
    throw new ConflictError(
      `Reorder suggestion for ${suggestion.productId} is already ${suggestion.status}`,
    );
  }

  return reorderSuggestionRepository.markDismissed(
    id,
    user.id,
    obj!.reason ?? null,
  );
};

// Turns a suggestion into a DRAFT order, never an approved one: committing money still
// goes through submit and approval. The cheapest active supplier for the product is
// chosen, and the buyer can change the draft before submitting it.
const convertSuggestion = async (id: string, user: CurrentUser) => {
  const suggestion = await getSuggestion(id);

  if (suggestion.status !== "OPEN") {
    throw new ConflictError(
      `Reorder suggestion for ${suggestion.productId} is already ${suggestion.status}`,
    );
  }

  // Vendor returns offers cheapest first
  const [offer] = await vendorClient.getProductSuppliers(suggestion.productId);

  if (!offer) {
    throw new ConflictError(
      `No active supplier is approved to provide ${suggestion.productId}`,
    );
  }

  const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
    {
      supplierId: offer.supplierId,
      notes: `Raised from a low stock report for ${suggestion.productName} at ${suggestion.locationId}`,
    },
    user.id,
  );

  await purchaseOrderService.addPurchaseOrderLine(purchaseOrder.id, {
    productId: suggestion.productId,
    quantityOrdered: suggestion.suggestedQuantity,
  });

  await reorderSuggestionRepository.markConverted(id, purchaseOrder.id);

  return purchaseOrderService.getPurchaseOrder(purchaseOrder.id);
};

export {
  convertSuggestion,
  dismissSuggestion,
  getSuggestion,
  listSuggestions,
  recordShortage,
};
