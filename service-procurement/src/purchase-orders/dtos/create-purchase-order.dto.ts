import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// The supplier's name and payment terms are not accepted from the client: they are read
// from Vendor Management and locked onto the order, so nobody can order on invented terms.
class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  supplierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  notes: string;
}

export { CreatePurchaseOrderDto };
