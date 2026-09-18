import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";

class UpdateCatalogItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays: number;
}

export { UpdateCatalogItemDto };
