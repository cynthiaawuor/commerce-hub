import type { Request, Response } from "express";
import { getCurrentUser } from "../core/current-user";
import { toPurchaseOrderResponse } from "../purchase-orders/purchase-orders.mapper";
import {
  REORDER_SUGGESTION_STATUSES,
  type ReorderSuggestionStatus,
} from "./reorder-suggestion-status";
import * as reorderSuggestionService from "./reorder-suggestions.service";

type IdParams = { id: string };

const isStatus = (value: unknown): value is ReorderSuggestionStatus =>
  typeof value === "string" &&
  (REORDER_SUGGESTION_STATUSES as readonly string[]).includes(value);

const listSuggestions = async (req: Request, res: Response) => {
  const status = isStatus(req.query["status"]) ? req.query["status"] : undefined;

  res
    .status(200)
    .json({ data: await reorderSuggestionService.listSuggestions(status) });
};

const dismissSuggestion = async (req: Request<IdParams>, res: Response) => {
  const suggestion = await reorderSuggestionService.dismissSuggestion(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res
    .status(200)
    .json({ message: "Reorder suggestion dismissed", data: suggestion });
};

const convertSuggestion = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await reorderSuggestionService.convertSuggestion(
    req.params.id,
    getCurrentUser(req),
  );

  res.status(201).json({
    message: "Draft purchase order raised from the reorder suggestion",
    data: toPurchaseOrderResponse(purchaseOrder),
  });
};

export { convertSuggestion, dismissSuggestion, listSuggestions };
