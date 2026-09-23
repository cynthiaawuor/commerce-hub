import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

// A rejection must say why: the buyer needs to know what to fix, and the reason
// becomes part of the order's audit trail.
class RejectPurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}

export { RejectPurchaseOrderDto };
