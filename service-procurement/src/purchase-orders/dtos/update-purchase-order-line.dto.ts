import { IsInt, IsOptional, Max, Min } from "class-validator";

// The product itself can't be changed: remove the line and add the right one instead.
// The service rejects a body with none of these fields.
class UpdatePurchaseOrderLineDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantityOrdered: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  unitCostCents: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays: number;
}

export { UpdatePurchaseOrderLineDto };
