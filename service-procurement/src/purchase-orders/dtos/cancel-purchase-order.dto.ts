import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

// A reason is encouraged but not required: an order can be cancelled simply because
// the business changed its mind.
class CancelPurchaseOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}

export { CancelPurchaseOrderDto };
