import type { Request, Response } from "express";
import { getCurrentUser } from "../core/current-user";
import { toPurchaseOrderResponse } from "./purchase-orders.mapper";
import * as purchaseOrderService from "./purchase-orders.service";

type IdParams = { id: string };
type LineParams = { id: string; lineId: string };

const createPurchaseOrder = async (req: Request, res: Response) => {
  const user = getCurrentUser(req);

  const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
    req.body,
    user.id,
  );

  res.status(201).json({
    message: "Purchase order created successfully",
    data: toPurchaseOrderResponse(purchaseOrder),
  });
};

const listPurchaseOrders = async (req: Request, res: Response) => {
  const { data, meta } = await purchaseOrderService.listPurchaseOrders(
    req.query,
  );

  res.status(200).json({ data: data.map(toPurchaseOrderResponse), meta });
};

const getPurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.getPurchaseOrder(
    req.params.id,
  );

  res.status(200).json({ data: toPurchaseOrderResponse(purchaseOrder) });
};

const deletePurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;

  await purchaseOrderService.deletePurchaseOrder(id);

  res
    .status(200)
    .json({ message: `Purchase order ${id} deleted successfully` });
};

const addPurchaseOrderLine = async (req: Request<IdParams>, res: Response) => {
  const line = await purchaseOrderService.addPurchaseOrderLine(
    req.params.id,
    req.body,
  );

  res
    .status(201)
    .json({ message: "Purchase order line added successfully", data: line });
};

const updatePurchaseOrderLine = async (
  req: Request<LineParams>,
  res: Response,
) => {
  const { id, lineId } = req.params;

  const line = await purchaseOrderService.updatePurchaseOrderLine(
    id,
    lineId,
    req.body,
  );

  res
    .status(200)
    .json({ message: "Purchase order line updated successfully", data: line });
};

const removePurchaseOrderLine = async (
  req: Request<LineParams>,
  res: Response,
) => {
  const { id, lineId } = req.params;

  await purchaseOrderService.removePurchaseOrderLine(id, lineId);

  res
    .status(200)
    .json({ message: `Line ${lineId} removed from purchase order ${id}` });
};

export {
  addPurchaseOrderLine,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  removePurchaseOrderLine,
  updatePurchaseOrderLine,
};
