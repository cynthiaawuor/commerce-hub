import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// A till asking to hold stock while it takes payment
class ReserveStockDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  locationId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // The POS transaction this is held for
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  reference: string;
}

export { ReserveStockDto };
