import { IsInt, Min } from "class-validator";

// Only the quantity can change. The unit cost and lead time were locked from Vendor
// Management when the line was added, and the product itself cannot be swapped
class UpdatePurchaseOrderLineDto {
  @IsInt()
  @Min(1)
  quantityOrdered: number;
}

export { UpdatePurchaseOrderLineDto };
