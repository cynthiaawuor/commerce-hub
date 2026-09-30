import { claimEvent } from "../events/processed-events.repository";
import { db } from "../prisma/db";

const ExpectedDelivery = db.orm.public.ExpectedDelivery;

type ApprovedOrder = {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  products: {
    productId: string;
    productName: string;
    quantityOrdered: number;
    unitCostCents: number;
  }[];
};
/* An approved order becomes something the dock expects. Claiming the event and
    writing the delivery happen together, so a redelivery cannot create it twice.
*/
const insertFromApprovedOrder = async (
  eventId: string,
  eventType: string,
  order: ApprovedOrder,
) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const delivery = await tx.orm.public.ExpectedDelivery.create({
      purchaseOrderId: order.purchaseOrderId,
      purchaseOrderNumber: order.purchaseOrderNumber,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
    });

    for (const product of order.products) {
      await tx.orm.public.ExpectedProduct.create({
        ...product,
        expectedDeliveryId: delivery.id,
      });
    }

    return delivery;
  });

/* What the dock is waiting for, oldest first: the earliest order is the one most
 likely on the truck */
const findOpen = async () =>
  ExpectedDelivery.where({ status: "OPEN" })
    .include("products", (product) =>
      product.orderBy((p) => p.productName.asc()),
    )
    .orderBy((delivery) => delivery.createdAt.asc())
    .all();

const findById = async (id: string) =>
  ExpectedDelivery.where({ id })
    .include("products", (product) =>
      product.orderBy((p) => p.productName.asc()),
    )
    .first();

export { findOpen, findById, insertFromApprovedOrder };
