import { NotFoundError } from "../core/http-error";
import * as expectedDeliveryRepository from "./expected-deliveries.repository";

// Each product carries what is still outstanding, which is what the clerk counts against
const withOutstanding = <
  T extends { products: { quantityOrdered: number; quantityReceived: number }[] },
>(
  delivery: T,
) => ({
  ...delivery,
  products: delivery.products.map((product) => ({
    ...product,
    quantityOutstanding: Math.max(product.quantityOrdered - product.quantityReceived, 0),
  })),
});

const listOpenDeliveries = async () =>
  (await expectedDeliveryRepository.findOpen()).map(withOutstanding);

const getExpectedDelivery = async (id: string) => {
  const delivery = await expectedDeliveryRepository.findById(id);

  if (!delivery) {
    throw new NotFoundError(`Expected delivery ${id} not found`);
  }

  return withOutstanding(delivery);
};

export { getExpectedDelivery, listOpenDeliveries };
