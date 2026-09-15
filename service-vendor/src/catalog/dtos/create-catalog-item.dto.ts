import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from "class-validator";

class CreateCatalogItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsInt()
  @Min(0)
  unitsInStock: number;
}

export { CreateCatalogItemDto };
