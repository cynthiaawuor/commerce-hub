import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from "class-validator";

class CreateCatalogItemDto {
  // ID of the product in the Inventory service
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  // Days the supplier needs to deliver after an order is placed
  @IsInt()
  @Min(0)
  leadTimeDays: number;
}

export { CreateCatalogItemDto };
