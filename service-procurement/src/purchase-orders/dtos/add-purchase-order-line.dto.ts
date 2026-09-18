import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// Money arrives in cents, so every amount is a whole number
class AddPurchaseOrderLineDto {
  // Soft reference to a product in the inventory service
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productId: string;

  // TEMPORARY (stage 3): the client supplies the catalog details. From stage 4 these are
  // read from service-vendor and locked onto the line, and they leave this DTO.
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  catalogItemId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productName: string;

  @IsInt()
  @Min(1)
  quantityOrdered: number;

  @IsInt()
  @Min(1)
  unitCostCents: number;

  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays: number;
}

export { AddPurchaseOrderLineDto };
