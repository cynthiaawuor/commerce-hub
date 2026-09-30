import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as goodsReceivedNoteService from "../goods-received-notes.service";

type IdParams = { id: string };

const createGoodsReceivedNote = async (req: Request, res: Response) => {
  const note = await goodsReceivedNoteService.createGoodsReceivedNote(
    req.body,
    getCurrentUser(req),
  );

  res.status(201).json({ message: "Goods received note issued", data: note });
};

const listGoodsReceivedNotes = async (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: await goodsReceivedNoteService.listGoodsReceivedNotes() });
};

const getGoodsReceivedNote = async (req: Request<IdParams>, res: Response) => {
  res
    .status(200)
    .json({ data: await goodsReceivedNoteService.getGoodsReceivedNote(req.params.id) });
};

export { createGoodsReceivedNote, getGoodsReceivedNote, listGoodsReceivedNotes };
