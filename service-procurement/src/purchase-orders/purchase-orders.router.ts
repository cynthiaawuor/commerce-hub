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

export default purchaseOrdersRouter;
