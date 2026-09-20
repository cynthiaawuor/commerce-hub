import type { Request, Response } from "express";
import { getCurrentUser } from "../core/current-user";
import {
  toPurchaseOrderResponse,
  toPurchaseOrderWithOutstanding,
} from "./purchase-orders.mapper";
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

const submitPurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.submitPurchaseOrder(
    req.params.id,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Purchase order submitted for approval",
    data: toPurchaseOrderResponse(purchaseOrder!),
  });
};

const approvePurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.approvePurchaseOrder(
    req.params.id,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Purchase order approved",
    data: toPurchaseOrderResponse(purchaseOrder!),
  });
};

const rejectPurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.rejectPurchaseOrder(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Purchase order rejected",
    data: toPurchaseOrderResponse(purchaseOrder!),
  });
};

const cancelPurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Purchase order cancelled",
    data: toPurchaseOrderResponse(purchaseOrder!),
  });
};

const sendPurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.sendPurchaseOrder(
    req.params.id,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Purchase order sent to the supplier",
    data: toPurchaseOrderResponse(purchaseOrder!),
  });
};

// Receiving calls this when a delivery arrives, optionally narrowed to one supplier
const listOpenPurchaseOrders = async (req: Request, res: Response) => {
  const supplierId =
    typeof req.query["supplierId"] === "string"
      ? req.query["supplierId"]
      : undefined;

  const purchaseOrders =
    await purchaseOrderService.listOpenPurchaseOrders(supplierId);

  res
    .status(200)
    .json({ data: purchaseOrders.map(toPurchaseOrderWithOutstanding) });
};

const receivePurchaseOrder = async (req: Request<IdParams>, res: Response) => {
  const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res.status(200).json({
    message: "Delivery recorded",
    data: toPurchaseOrderWithOutstanding(purchaseOrder!),
  });
};

const getPurchaseOrderHistory = async (
  req: Request<IdParams>,
  res: Response,
) => {
  const history = await purchaseOrderService.getPurchaseOrderHistory(
    req.params.id,
  );

  res.status(200).json({ data: history });
};

export {
  addPurchaseOrderLine,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrderHistory,
  listOpenPurchaseOrders,
  listPurchaseOrders,
  receivePurchaseOrder,
  rejectPurchaseOrder,
  removePurchaseOrderLine,
  sendPurchaseOrder,
  submitPurchaseOrder,
  updatePurchaseOrderLine,
};
