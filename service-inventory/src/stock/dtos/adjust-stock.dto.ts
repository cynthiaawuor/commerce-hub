import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// A correction to what the system thinks is on the shelf: a stock count, damage,
// shrinkage. A reason is required, because an unexplained change to stock is the
// problem this module exists to remove.
class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  locationId: string;

  // Positive adds stock, negative removes it. Zero would record nothing.
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(trim)
  reason: string;

  // A stock count sheet, an incident number
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  reference: string;
}

export { AdjustStockDto };
