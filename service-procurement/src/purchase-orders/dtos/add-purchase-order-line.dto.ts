import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

// The buyer chooses the product and how many. Price, lead time, product name and the
// catalog item they came from are read from Vendor Management and locked onto the line.
class AddPurchaseOrderLineDto {
  // Soft reference to a product in the inventory service
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  productId: string;

  @IsInt()
  @Min(1)
  quantityOrdered: number;
}

export { AddPurchaseOrderLineDto };
