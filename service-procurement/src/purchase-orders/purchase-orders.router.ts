import { Router } from "express";
import * as purchaseOrderController from "./purchase-orders.controller";

const purchaseOrdersRouter: Router = Router();

purchaseOrdersRouter.get("/", purchaseOrderController.listPurchaseOrders);
purchaseOrdersRouter.post("/", purchaseOrderController.createPurchaseOrder);
purchaseOrdersRouter.get("/:id", purchaseOrderController.getPurchaseOrder);
purchaseOrdersRouter.delete("/:id", purchaseOrderController.deletePurchaseOrder);

purchaseOrdersRouter.post(
  "/:id/lines",
  purchaseOrderController.addPurchaseOrderLine,
);
purchaseOrdersRouter.patch(
  "/:id/lines/:lineId",
  purchaseOrderController.updatePurchaseOrderLine,
);
purchaseOrdersRouter.delete(
  "/:id/lines/:lineId",
  purchaseOrderController.removePurchaseOrderLine,
);

// Approval workflow. Each one is an action on an order, not a field to edit,
// so they are POSTs rather than a PATCH of the status.
purchaseOrdersRouter.post(
  "/:id/submit",
  purchaseOrderController.submitPurchaseOrder,
);
purchaseOrdersRouter.post(
  "/:id/approve",
  purchaseOrderController.approvePurchaseOrder,
);
purchaseOrdersRouter.post(
  "/:id/reject",
  purchaseOrderController.rejectPurchaseOrder,
);
purchaseOrdersRouter.post(
  "/:id/cancel",
  purchaseOrderController.cancelPurchaseOrder,
);
purchaseOrdersRouter.get(
  "/:id/history",
  purchaseOrderController.getPurchaseOrderHistory,
);

export default purchaseOrdersRouter;
