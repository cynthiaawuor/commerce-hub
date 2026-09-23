import { Transform } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// SKUs are quoted by people and matched by machines, so they are stored upper case
const upper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

// averageCostCents is deliberately absent: cost comes from goods received, never
// from whoever is creating the product.
class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(upper)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trim)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(trim)
  unitOfMeasure: string;

  // Physical attributes Warehouse Operations uses when deciding where to put stock
  @IsOptional()
  @IsInt()
  @Min(0)
  widthMm: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  heightMm: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  depthMm: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightG: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  reorderPoint: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  reorderQuantity: number;
}

export { CreateProductDto };
