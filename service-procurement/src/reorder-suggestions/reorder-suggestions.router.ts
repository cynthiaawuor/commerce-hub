import { Router } from "express";
import * as reorderSuggestionController from "./reorder-suggestions.controller";

const reorderSuggestionsRouter: Router = Router();

reorderSuggestionsRouter.get("/", reorderSuggestionController.listSuggestions);
reorderSuggestionsRouter.post(
  "/:id/dismiss",
  reorderSuggestionController.dismissSuggestion,
);
reorderSuggestionsRouter.post(
  "/:id/convert",
  reorderSuggestionController.convertSuggestion,
);

export default reorderSuggestionsRouter;
