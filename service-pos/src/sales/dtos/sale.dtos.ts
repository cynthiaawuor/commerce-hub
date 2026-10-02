import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

// A cashier starts serving a customer at a till
class OpenSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Z0-9-]+$/, { message: "registerCode may only use letters, numbers and dashes" })
  @Transform(trimUpper)
  registerCode: string;
}

// One scan: a product by its code, and how many
class AddProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimUpper)
  sku: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

// Validated per entry by the service, which reports problems as payments[0].amountCents
class TenderDto {
  @IsIn(["CASH", "CARD"])
  method: "CASH" | "CARD";

  @IsInt()
  @Min(1)
  amountCents: number;
}

class PaySaleDto {
  @IsArray()
  @ArrayNotEmpty()
  payments: unknown[];
}

export { AddProductDto, OpenSaleDto, PaySaleDto, TenderDto };
