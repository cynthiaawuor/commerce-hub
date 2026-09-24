import { Transform } from "class-transformer";
import {
  IsBoolean,
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

// The SKU cannot change: other services quote it, and movements already recorded
// refer to this product. Deactivate and create a new one instead.
class UpdateProductDto {
  @IsOptional()
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

  // Retired products stop being suggested and cannot be ordered, but their history stays
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export { UpdateProductDto };
