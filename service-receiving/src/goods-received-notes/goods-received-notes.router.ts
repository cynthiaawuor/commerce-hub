import { Router } from "express";
import * as goodsReceivedNoteController from "./controllers/goods-received-notes.controller";

const goodsReceivedNotesRouter: Router = Router();

goodsReceivedNotesRouter.get("/", goodsReceivedNoteController.listGoodsReceivedNotes);
goodsReceivedNotesRouter.post("/", goodsReceivedNoteController.createGoodsReceivedNote);
goodsReceivedNotesRouter.get("/:id", goodsReceivedNoteController.getGoodsReceivedNote);

export default goodsReceivedNotesRouter;
